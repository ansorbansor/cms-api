import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as xlsx from 'xlsx';
import { User } from 'src/entities/user.entity';
import { failedResponse, successResponse } from 'src/utils/responses';
import { getManager, Repository } from 'typeorm';
import { ActivityLogService } from '../activity-log/activity-log.service';
import * as fs from 'fs';
import { isString } from 'class-validator';
import { Region } from 'src/entities/region.entity';
import { PurchaseOrder } from 'src/entities/purchase-order.entity';
import { Area } from 'src/entities/area.entity';
import { Operator } from 'src/entities/operator.entity';
import { Customer } from 'src/entities/customer.entity';
import { Project } from 'src/entities/project.entity';
import { Site } from 'src/entities/site.entity';
import { BiddingArea } from 'src/entities/bidding_area.entity';
import { RemarkProject } from 'src/entities/remark-project.entity';
import { StatusAcceptance } from 'src/entities/status-acceptance.entity';
import { PendingType } from 'src/entities/pending-type.entity';
import { PD } from 'src/entities/pd.entity';
import moment from 'moment';
import { PurchaseOrderInvoice } from 'src/entities/purchase-order-invoice.entity';
import { EmployeePosition } from 'src/entities/employee-position.entity';
import * as bcrypt from 'bcryptjs';
import { importUniqueId } from 'src/utils/encryption-helper';

@Injectable()
export class ImportService {
  constructor(
    @InjectRepository(Region)
    private regionRepository: Repository<Region>,
    @InjectRepository(PurchaseOrder)
    private poRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderInvoice)
    private poiRepository: Repository<PurchaseOrderInvoice>,
    @InjectRepository(PD)
    private pdRepository: Repository<PD>,
    @InjectRepository(PendingType)
    private pendingTypeRepository: Repository<PurchaseOrder>,
    @InjectRepository(StatusAcceptance)
    private statusAcceptanceRepository: Repository<StatusAcceptance>,
    @InjectRepository(RemarkProject)
    private remarkProjectRepository: Repository<RemarkProject>,
    @InjectRepository(BiddingArea)
    private biddingAreaRepository: Repository<BiddingArea>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Site)
    private siteRepository: Repository<Site>,
    @InjectRepository(Area)
    private areaRepository: Repository<Area>,
    @InjectRepository(Operator)
    private operatorRepository: Repository<Operator>,
    @InjectRepository(EmployeePosition)
    private employeePositionRepository: Repository<EmployeePosition>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private activityLogService: ActivityLogService,
  ) { }

  regionData = null;
  areaData = null;
  operatorData = null;
  customerData = null;
  projectData = null;
  siteData = null;
  biddingAreaData = null;
  remarkProjectData = null;
  statusAcceptanceData = null;
  pendingTypeData = null;
  pdData = null;
  employeePositionData = null;
  userData = null;

  async importUser(file, user: User, ip: string) {
    if (!file) {
      throw failedResponse(HttpStatus.BAD_REQUEST, 'Harap kirimkan file');
    }

    try {
      const userData = await getManager().query(
        `SELECT * FROM users WHERE deleted_at IS NULL`,
      );

      const workbook = xlsx.readFile(file.path);

      const worksheet = workbook.Sheets['Detail'];
      if (worksheet) {
        this.employeePositionData = await getManager().query(
          `SELECT * FROM employee_positions WHERE deleted_at IS NULL`,
        );

        const updateDataUserList = [];
        const insertDataUserList = [];
        const rowData = xlsx.utils
          .sheet_to_json(worksheet, { raw: false })
          .map((row) =>
            Object.keys(row).reduce((obj, key) => {
              obj[key.trim().toLowerCase()] = isString(row[key.trim()])
                ? row[key].trim()
                : row[key];
              return obj;
            }, {}),
          );

        for (const value of rowData) {
          if (
            value['id number (ktp)'] &&
            value['id number (ktp)'].replace(/[^0-9]/g, '') != '' &&
            value['resource name']
          ) {
            //check exists or new User
            const indexDataExisting = userData.findIndex(
              (item) => item.nik == value['id number (ktp)'],
            );

            if (indexDataExisting > -1) {
              const existingId = userData[indexDataExisting].id;
              if (updateDataUserList.some(u => u.id === existingId)) continue;
              const updateData = await this.validateUserData(
                value,
                userData[indexDataExisting],
              );
              if (updateData.email) {
                if (userData.some(u => u.email === updateData.email && u.id !== existingId) || updateDataUserList.some(u => u.email === updateData.email)) {
                  delete updateData.email;
                }
              }

              if (Object.keys(updateData).length > 0) {
                //add user to updated object and push to list
                updateData.id = existingId;
                updateDataUserList.push(updateData);
              }
            } else {
              const currentNik = value['id number (ktp)'];
              if (insertDataUserList.some(u => u.nik === currentNik)) {
                  continue;
              }
              const inserUser = new User();
              inserUser.region = value['region office'];
              inserUser.gm_region = value['gm region'];
              inserUser.company = value['subcont company'];
              inserUser.category = value['position'];
              inserUser.name = value['resource name'];
              inserUser.nik = value['id number (ktp)'];
              const rawEmail = typeof value['email'] === 'string' ? value['email'].trim() : value['email'];
              let finalEmail = rawEmail ? rawEmail : null;
              if (finalEmail) {
                if (userData.some(u => u.email === finalEmail) || insertDataUserList.some(u => u.email === finalEmail)) {
                  finalEmail = null;
                }
              }
              inserUser.email = finalEmail;
              inserUser.phone = value['phone number']
                ? value['phone number'].replace(/[^0-9]/g, '')
                : null;
              inserUser.employee_position_id = value['hak access']
                ? (await this.getEmployeePositionByName(value['hak access'])).id
                : null;
              inserUser.team_number = value['employee id'];
              inserUser.uniportal_account = value['uniportal account'];
              inserUser.project = value['join date'];
              const remarkStatus = typeof value['remark employee status'] === 'string'
                ? value['remark employee status'].trim().toLowerCase()
                : '';
              inserUser.status = remarkStatus === 'on board' ? true : false;
              inserUser.status_description = remarkStatus || null;
              inserUser.pass_id_number = value['pass id number'];
              inserUser.cyber_security_status = value['cyber security status'];
              inserUser.level_iresource = value['status karyawan'];
              inserUser.wah_certification_number =
                value['wah certification number'];

              const wahValidationEndDate = moment(
                new Date(value['wah validation end date']),
              ).format('YYYY-MM-D');
              inserUser.wah_validation_end_date =
                wahValidationEndDate != 'Invalid date'
                  ? new Date(wahValidationEndDate + ' 23:59:59')
                  : null;

              inserUser.electrical_certification_number =
                value['electrical certification number'];

              const electricalValidationEndDate = moment(
                new Date(value['electrical validation end date']),
              ).format('YYYY-MM-D');
              inserUser.electrical_validation_end_date =
                electricalValidationEndDate != 'Invalid date'
                  ? new Date(electricalValidationEndDate + ' 23:59:59')
                  : null;

              inserUser.firstaid_certification_number =
                value['first aid certification number'];

              const firstaidValidationEndDate = moment(
                new Date(value['first aid validation end date']),
              ).format('YYYY-MM-D');
              inserUser.firstaid_validation_end_date =
                firstaidValidationEndDate != 'Invalid date'
                  ? new Date(firstaidValidationEndDate + ' 23:59:59')
                  : null;

              inserUser.password = 'Biosron123';

              inserUser.bank = value['nama bank'];
              inserUser.bank_account_number = value['Nomor Rekening'];

              insertDataUserList.push(inserUser);
            }
          }
        }

        let successMessage = 'Berhasil ';

        //update data User
        if (updateDataUserList.length > 0) {
          for (const element of updateDataUserList) {
            await this.userRepository.update(
              {
                id: element.id,
              },
              element,
            );
          }
          successMessage += `mengupdate ${updateDataUserList.length} data Karyawan, `;
        }

        //insert data new User
        if (insertDataUserList.length > 0) {
          console.log(`insert ${insertDataUserList.length} data`);
          await this.userRepository.save(insertDataUserList, {
            chunk: 1000,
          });

          successMessage += `menambah ${insertDataUserList.length} data Karyawan, `;
        }

        await this.activityLogService.create({
          user_id: user.id,
          description: successMessage,
          ip: ip,
        });

        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }

        return successResponse(null, successMessage.slice(0, -2));
      } else {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        throw failedResponse(
          HttpStatus.BAD_REQUEST,
          "Sheet 'Detail' tidak ditemukan",
        );
      }
    } catch (err) {
      console.log(err);
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw err;
    }
  }

  async importPO(file, user: User, ip: string, forceCc: boolean = false) {
    if (!file) {
      throw failedResponse(HttpStatus.BAD_REQUEST, 'Harap kirimkan file');
    }

    let line = 0;

    try {
      const workbook = xlsx.readFile(file.path);
      const worksheet = workbook.Sheets['Detail'];
      let totalInsertPO = 0;
      let totalUpdatePO = 0;
      let totalInsertESAR = 0;
      let totalUpdateESAR = 0;
      let totalInsertInvoice = 0;
      let totalUpdateInvoice = 0;

      if (worksheet) {
        await this.getExistingMasterData();

        const poData = await getManager().query(
          `SELECT * FROM purchase_orders WHERE deleted_at IS NULL`,
        );

        const poInvoiceData = await getManager().query(
          `SELECT 
          poi.id "poi_id",  
          po.id "po_id",
          po.created_at,
          poi.invoice_number, 
          poi.invoice_date, 
          poi.invoice_date, 
          poi.invoice_status, 
          poi.payment_date, 
          poi.supplier_tax_number, 
          poi.supplier_tax_date, 
          poi.purchase_order_id,
          poi.payment_amount,
          poi.deduction_amount,
          poi.unit_price,
          po.cc,
          poi.submit_amount,
          poi.approve_amount,
          poi.position
        FROM 
          purchase_order_invoices poi, purchase_orders po
        WHERE 
          poi.deleted_at IS NULL AND 
          po.deleted_at IS NULL AND
          poi.purchase_order_id = po.id`,
        );

        let rowData = xlsx.utils
          .sheet_to_json(worksheet, {
            raw: false,
            dateNF: 'yyyy-mm-dd',
          })
          .map((row) =>
            Object.keys(row).reduce((obj, key) => {
              obj[key.trim().toLowerCase()] = isString(row[key])
                ? row[key].trim()
                : row[key];
              return obj;
            }, {}),
          );

        console.log(`done rowData, total : ${rowData.length}`);

        //filter not empty data
        rowData = rowData.filter((value) => {
          const hasCc = value['cc'] != '' && value['cc'] != null;
          const hasUniqueId = value['unique id'] != '' && value['unique id'] != null;
          return hasCc || hasUniqueId;
        });

        console.log(`size rowData after filter : ${rowData.length}`);

        const updateDataPOList = [];
        const deletedId = [];
        const deletedIndex = [];

        //check all rows
        for (const [index, value] of rowData.entries()) {
          line = index + 2;
          console.log(`checking unique id row ${index} of ${rowData.length}`);
          if (
            value['unique id'] != null &&
            value['unique id'] != undefined &&
            value['unique id'] != ''
          ) {
            //check all data valid
            if (value['unique id'].split('-').length <= 1) {
              throw new Error(
                `Unique ID ${value['unique id']} not found, make field empty to add data.`,
              );
            }

            //check there is delete data
            if (
              value['delete data'] != null &&
              value['delete data'] != undefined &&
              (value['delete data'] === true ||
                value['delete data'].toLowerCase() == 'true')
            ) {
              let id = value['unique id'];
              id = id.split('-');
              if (id.length == 3) {
                deletedId.push(Number(id[2]));
                deletedIndex.push(index);
              }
            }
          }
        }

        // deletedIndex.forEach((element) => {
        //   rowData.splice(element, 1);
        // });

        console.log(`deleted id : ${deletedId}`);

        if (deletedId.length > 0) {
          const placeholders = deletedId
            .map((_, index) => `$${index + 1}`)
            .join(', ');
          await getManager().query(
            `UPDATE purchase_orders SET deleted_at = NOW() WHERE id IN (${placeholders})`,
            deletedId,
          );
        }

        const updateDataPOExistingInvoiceList = [];
        const insertedDataPOExistingInvoiceList = [];

        line = 0;
        let lastProcessedCc = '-';

        for (const [index, value] of rowData.entries()) {
          line = index + 2;
          if (
            value['delete data'] == null ||
            value['delete data'] == undefined ||
            value['delete data'] !== true ||
            value['delete data'].toLowerCase() != 'true'
          ) {
            let uniqueId = '';

            if (
              value['unique id'] != null &&
              value['unique id'] != undefined &&
              value['unique id'] != ''
            ) {
              const parsedId = importUniqueId(value['unique id']);
              // importUniqueId returns the 3rd segment of format "YYYYBsn-MMDD-{id}"
              // If the format is wrong (e.g. plain number from Excel), parsedId will be undefined
              uniqueId = parsedId != null && parsedId != undefined && parsedId != '' ? parsedId : '';
            }

            //check if new PO
            if (uniqueId == '' || uniqueId == null) {
              console.log(`checking new PO row ${index} of ${rowData.length}`);

              // NEW CC CHECK LOGIC
              const ccCode = value['cc'];
              if (ccCode) {
                const ccExists = poData.some(po => po.cc === ccCode);
                if (ccExists && !forceCc) {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                    throw new HttpException({
                        meta: {
                            code: 'CC_CONFLICT',
                            message: `cc berikut "${ccCode}" sudah memiliki Biosron ID, di file yang kamu export belum ada Biosron ID nya. Mau Lanjut daftarin cc ini menggunakan Biosron ID baru??`,
                        },
                        data: {
                            new_count: totalInsertPO,
                            update_count: totalUpdatePO,
                            last_cc: lastProcessedCc
                        }
                    }, HttpStatus.CONFLICT);
                }
              }

              const insertPO = new PurchaseOrder();
              insertPO.user_id = user.id;
              insertPO.cc = value['cc'];
              insertPO.line_po_status =
                value['line po status'] == 'Active' ? 1 : 0;
              insertPO.line_po_number = value['po line no.'];
              insertPO.po_number = value['po no.'];
              insertPO.shipment_number = value['shipment no.'];
              insertPO.region_id = value['region']
                ? (await this.getRegionByName(value['region'])).id
                : null;
              insertPO.area_id = value['area']
                ? (await this.getAreaByName(value['area'])).id
                : null;
              insertPO.operator_id = value['operator']
                ? (await this.getOperatorByName(value['operator'])).id
                : null;
              insertPO.customer_id = value['customer']
                ? (await this.getCustomerByName(value['customer'])).id
                : null;
              insertPO.project_id =
                value['project name'] && value['project code']
                  ? (
                    await this.getProjectByName(
                      value['project name'],
                      value['project code'],
                    )
                  ).id
                  : null;
              insertPO.site_id =
                value['site name'] && value['site code']
                  ? (
                    await this.getSiteByName(
                      value['site name'],
                      value['site code'],
                    )
                  ).id
                  : null;
              insertPO.status = value['po status'];
              insertPO.item_code = value['item code'];
              insertPO.item_description = value['item description'];
              insertPO.unit_price = value['unit price']
                ? value['unit price']
                : 0;
              insertPO.unit_price_1 = value['unit price 1 (100/60/70/80)']
                ? value['unit price 1 (100/60/70/80)']
                : 0;
              insertPO.unit_price_2 = value['unit price 2 (20/30/40)']
                ? value['unit price 2 (20/30/40)']
                : 0;
              insertPO.requested_qty = value['requested qty']
                ? value['requested qty']
                : 0;
              insertPO.billed_qty = value['billed qty']
                ? value['billed qty']
                : 0;
              insertPO.due_qty = value['due qty'] ? value['due qty'] : 0;
              insertPO.line_amount = value['line amount']
                ? value['line amount']
                : 0;
              insertPO.remaining_from_po = value['remaining from po']
                ? value['remaining from po']
                : 0;
              insertPO.unit = value['unit'];
              insertPO.payment_terms = value['payment terms'];
              insertPO.bidding_area_id = value['bidding area']
                ? (await this.getBiddingAreaByName(value['bidding area'])).id
                : null;
              insertPO.publish_date = moment(
                value['publish date'],
                moment.ISO_8601,
              ).isValid()
                ? value['publish date']
                : null;
              insertPO.start_date = moment(
                value['start date'],
                moment.ISO_8601,
              ).isValid()
                ? value['start date']
                : null;
              insertPO.end_date = moment(
                value['end date'],
                moment.ISO_8601,
              ).isValid()
                ? value['end date']
                : null;
              insertPO.priority_esar_approve = value['priority esar approve'];
              insertPO.remark_weekly = value['remark weekly'];
              insertPO.remark_project_id = value['remark project']
                ? (await this.getRemarkProjectByName(value['remark project']))
                  .id
                : null;
              insertPO.status_acceptance_id = value['status of acceptance']
                ? (
                  await this.getStatusAcceptanceByName(
                    value['status of acceptance'],
                  )
                ).id
                : null;
              insertPO.pending_type_id = value['pending type']
                ? (await this.getPendingTypeByName(value['pending type'])).id
                : null;
              insertPO.pending_approval_pd = value['pending approval pd'];
              insertPO.amount_pending_approval_pd = value[
                'amount pending approval pd'
              ]
                ? value['amount pending approval pd']
                : 0;
              insertPO.pd_id = value['pd name']
                ? (await this.getPDByName(value['pd name'])).id
                : null;
              insertPO.actual_completion_date = moment(
                value['actual completion date vs to pd'],
                moment.ISO_8601,
              ).isValid()
                ? value['actual completion date vs to pd']
                : null;
              insertPO.ready_invoice = value['ready invoice'];
              insertPO.amount_ready_invoice = value['amount ready invoice']
                ? value['amount ready invoice']
                : 0;
              insertPO.remark_highlight = value['remark highlight'];
              insertPO.budget_percentage = value['budget percentage']
                ? value['budget percentage']
                : 0;
              insertPO.ny_invoice = value['ny invoice']
                ? value['ny invoice']
                : 0;
              insertPO.ny_invoice_date = moment(
                value['ny invoice date'],
                moment.ISO_8601,
              ).isValid()
                ? value['ny invoice date']
                : null;
              // PIUTANG IS AUTO CALCULATED, IGNORE EXCEL INPUT
              // insertPO.piutang = value['piutang'] ? value['piutang'] : 0;
              insertPO.priority_site_list = value['priority site list']
                ? value['priority site list']
                : null;
              insertPO.amount_priority = value['amount priority']
                ? value['amount priority']
                : 0;
              insertPO.achievement_priority = value['achievement priority']
                ? value['achievement priority']
                : 0;
              insertPO.actual_work_date = moment(
                value['actual bulan pengerjaan'],
                moment.ISO_8601,
              ).isValid()
                ? value['actual bulan pengerjaan']
                : null;
              insertPO.actual_work_amount = value['actual nilai pengerjaan']
                ? value['actual nilai pengerjaan']
                : 0;
              insertPO.actual_work_status = value[
                'status actual bulan pengerjaan'
              ]
                ? value['status actual bulan pengerjaan']
                : null;
              insertPO.remark_highlight_recon = value['remark highlight rekon']
                ? value['remark highlight rekon']
                : null;

              const pic = await this.getUserByName(value['pic']);

              if (pic != null && pic != undefined) {
                insertPO.pic = pic.id;
              }

              insertPO.plan_date = moment(
                value['plan date'],
                moment.ISO_8601,
              ).isValid()
                ? value['plan date']
                : null;

              // Initialize total_acceptance to 0 to prevent not-null constraint error on first save
              insertPO.total_acceptance = 0;

              //insert new PO to DB
              const newPO = await this.poRepository.save(insertPO);
              totalInsertPO++;

              let totalAcceptance = 0;

              //get list invoice
              const insertedInvoice = [];
              const invNumbersInsert = new Set<string>();
              for (const key of Object.keys(value)) {
                const match = key.match(/^ac(\d+)/);
                if (match) invNumbersInsert.add(match[1]);
              }

              for (const invNo of Array.from(invNumbersInsert)) {
                  const inv = {
                    purchase_order_id: newPO.id,
                    invoice_number: value[`ac${invNo} inv`],
                    invoice_date:
                      value[`ac${invNo} inv date`] &&
                        moment(
                          value[`ac${invNo} inv date`],
                          moment.ISO_8601,
                        ).isValid()
                        ? value[`ac${invNo} inv date`]
                        : null,
                    invoice_status: value[`ac${invNo} inv status`],
                    payment_date:
                      value[`payment date ${invNo}`] &&
                        moment(
                          value[`payment date ${invNo}`],
                          moment.ISO_8601,
                        ).isValid()
                        ? value[`payment date ${invNo}`]
                        : null,
                    supplier_tax_number:
                      value[`ac${invNo} (supplier tax invoice no.)`],
                    supplier_tax_date:
                      value[`ac${invNo} (supplier tax invoice no.) date`] &&
                        moment(
                          value[`ac${invNo} (supplier tax invoice no.) date`],
                          moment.ISO_8601,
                        ).isValid()
                        ? value[`ac${invNo} (supplier tax invoice no.) date`]
                        : null,
                    user_id: user.id,
                    cc: value['cc'],
                    payment_amount: value[`ac${invNo} payment amount`]
                      ? value[`ac${invNo} payment amount`]
                      : 0,
                    deduction_amount: value[`ac${invNo} deduction amount`]
                      ? value[`ac${invNo} deduction amount`]
                      : 0,
                    unit_price: value[`ac${invNo} unit price`]
                      ? value[`ac${invNo} unit price`]
                      : 0,
                    submit_date:
                      value[`ac${invNo} submit date`] &&
                        moment(
                          value[`ac${invNo} submit date`],
                          moment.ISO_8601,
                        ).isValid()
                        ? value[`ac${invNo} submit date`]
                        : null,
                    submit_amount: value[`ac${invNo} submit amount`]
                      ? value[`ac${invNo} submit amount`]
                      : 0,
                    approve_date:
                      value[`ac${invNo} approve date`] &&
                        moment(
                          value[`ac${invNo} approve date`],
                          moment.ISO_8601,
                        ).isValid()
                        ? value[`ac${invNo} approve date`]
                        : null,
                    approve_amount: value[`ac${invNo} approve amount`]
                      ? value[`ac${invNo} approve amount`]
                      : 0,
                    position: invNo,
                  };

                  if (inv.approve_date != null && inv.approve_date != '') {
                    totalAcceptance += Number(inv.approve_amount);
                  }

                  insertedInvoice.push(inv);
                  totalInsertInvoice++;
              }

              if (
                totalAcceptance != 0 &&
                newPO.total_acceptance != totalAcceptance
              ) {
                await this.poRepository.update(
                  {
                    id: newPO.id,
                  },
                  {
                    total_acceptance: totalAcceptance,
                  },
                );
              }

              if (insertedInvoice.length > 0) {
                console.log(`start insert po total ${insertedInvoice.length}`);
                await this.poiRepository.save(insertedInvoice, {
                  chunk: 1000,
                });
              }
            } else {
              console.log(
                `checking existing PO row ${index} of ${rowData.length}, id ${uniqueId}`,
              );

              const indexDataExisting = poData.findIndex(
                (item) => item.id == uniqueId,
              );

              if (indexDataExisting < 0) {
                // PO not found - could be invalid Biosron ID format or truly deleted
                console.warn(`PO with id ${uniqueId} not found in DB, skipping row ${index}`);
                continue;
              }

              const updateDataPO = await this.validatePOData(
                value,
                poData[indexDataExisting],
              );

              if (Object.keys(updateDataPO).length > 0) {
                //add user to updated object and push to list
                updateDataPO.user_id = user.id;
                updateDataPO.id = uniqueId;
                updateDataPOList.push(updateDataPO);
                totalUpdatePO++;
              }

              //get list invoice

              let totalAcceptance = 0;

              const rowKeys = Object.keys(value);

              // Detect which part is being imported based on column headers in the row
              const hasESARCols = rowKeys.some(k =>
                /^ac\d+ unit price$/.test(k) ||
                /^ac\d+ submit date$/.test(k) ||
                /^ac\d+ submit amount$/.test(k) ||
                /^ac\d+ approve date$/.test(k) ||
                /^ac\d+ approve amount$/.test(k)
              );
              const hasInvCols = rowKeys.some(k =>
                /^ac\d+ inv$/.test(k) ||
                /^ac\d+ inv date$/.test(k) ||
                /^ac\d+ inv status$/.test(k) ||
                /^payment date \d+$/.test(k) ||
                /^ac\d+ \(supplier tax/.test(k) ||
                /^ac\d+ payment amount$/.test(k) ||
                /^ac\d+ deduction amount$/.test(k)
              );

              console.log(`Row ${index}: hasESARCols=${hasESARCols}, hasInvCols=${hasInvCols}`);

              const invNumbersUpdate = new Set<string>();
              for (const key of rowKeys) {
                // Capture from ac{N} prefixed columns
                const acMatch = key.match(/^ac(\d+)/);
                if (acMatch) invNumbersUpdate.add(acMatch[1]);
                // Also capture from 'payment date {N}' columns
                const pdMatch = key.match(/^payment date (\d+)$/);
                if (pdMatch) invNumbersUpdate.add(pdMatch[1]);
              }

              for (const invNo of Array.from(invNumbersUpdate)) {
                  // Build inv object conditionally based on which mode is active
                  const inv: any = {
                    purchase_order_id: uniqueId,
                    position: invNo,
                    user_id: user.id,
                    cc: value['cc'],
                  };

                  // ESAR fields — only populate if file has ESAR columns
                  if (hasESARCols) {
                    inv.unit_price = value[`ac${invNo} unit price`] ? value[`ac${invNo} unit price`] : 0;
                    inv.submit_amount = value[`ac${invNo} submit amount`] ? value[`ac${invNo} submit amount`] : 0;
                    inv.approve_amount = value[`ac${invNo} approve amount`] ? value[`ac${invNo} approve amount`] : 0;
                    const submitDateVal = value[`ac${invNo} submit date`];
                    if (submitDateVal && !moment(submitDateVal, moment.ISO_8601).isValid()) {
                      throw new Error(`Invalid Date format at line ${line} column ac${invNo} submit date`);
                    }
                    inv.submit_date = submitDateVal || null;
                    const approveDateVal = value[`ac${invNo} approve date`];
                    if (approveDateVal && !moment(approveDateVal, moment.ISO_8601).isValid()) {
                      throw new Error(`Invalid Date format at line ${line} column ac${invNo} approve date`);
                    }
                    inv.approve_date = approveDateVal || null;
                  }

                  // Invoice fields — only populate if file has Invoice columns
                  if (hasInvCols) {
                    inv.invoice_number = value[`ac${invNo} inv`];
                    inv.invoice_date = value[`ac${invNo} inv date`] &&
                      moment(value[`ac${invNo} inv date`], moment.ISO_8601).isValid()
                        ? value[`ac${invNo} inv date`] : null;
                    inv.invoice_status = value[`ac${invNo} inv status`];
                    inv.payment_date = value[`payment date ${invNo}`] &&
                      moment(value[`payment date ${invNo}`], moment.ISO_8601).isValid()
                        ? value[`payment date ${invNo}`] : null;
                    inv.supplier_tax_number = value[`ac${invNo} (supplier tax invoice no.)`];
                    inv.supplier_tax_date = value[`ac${invNo} (supplier tax invoice no.) date`] &&
                      moment(value[`ac${invNo} (supplier tax invoice no.) date`], moment.ISO_8601).isValid()
                        ? value[`ac${invNo} (supplier tax invoice no.) date`] : null;
                    inv.payment_amount = value[`ac${invNo} payment amount`] ? value[`ac${invNo} payment amount`] : 0;
                    inv.deduction_amount = value[`ac${invNo} deduction amount`] ? value[`ac${invNo} deduction amount`] : 0;
                  }

                  const indexDataInvoiceExisting = poInvoiceData.findIndex(
                    (item) =>
                      item.po_id == inv.purchase_order_id &&
                      (item.position == inv.position || (inv.invoice_number && item.invoice_number == inv.invoice_number))
                  );

                  if (indexDataInvoiceExisting > -1) {
                    const updateData = await this.validateInvoicePOData(
                      inv,
                      poInvoiceData[indexDataInvoiceExisting],
                      poData[indexDataExisting],
                      hasESARCols,
                      hasInvCols,
                    );

                    if (Object.keys(updateData).length > 0) {
                      updateData.id = poInvoiceData[indexDataInvoiceExisting].poi_id;
                      updateData.purchase_order_id = uniqueId;
                      updateData.user_id = user.id;

                      updateDataPOExistingInvoiceList.push(updateData);
                      if (hasESARCols) totalUpdateESAR++;
                      if (hasInvCols) totalUpdateInvoice++;
                    }
                  } else {
                    // Insert new invoice if it has any relevant data
                    const hasData = (hasESARCols && (inv.unit_price || inv.submit_amount || inv.approve_amount || inv.submit_date || inv.approve_date)) ||
                                    (hasInvCols && (inv.invoice_number || inv.invoice_date || inv.payment_date || inv.payment_amount || inv.supplier_tax_number || inv.supplier_tax_date || inv.deduction_amount));
                    if (hasData) {
                      if (hasESARCols) totalInsertESAR++;
                      if (hasInvCols) totalInsertInvoice++;
                      insertedDataPOExistingInvoiceList.push(inv);
                    }
                  }

                  if (inv.approve_date != null && inv.approve_date != '') {
                    totalAcceptance += Number(inv.approve_amount);
                  }
              }

              if (
                totalAcceptance != 0 &&
                poData[indexDataExisting].total_acceptance != totalAcceptance
              ) {
                await this.poRepository.update(
                  {
                    id: poData[indexDataExisting].id,
                  },
                  {
                    total_acceptance: totalAcceptance,
                  },
                );
              }
            }
          }
        }
        console.log('done loop');

        //update data PO
        if (updateDataPOList.length > 0) {
          let ipo = 0;
          for (const element of updateDataPOList) {
            ipo++;
            console.log(`update PO ${ipo} of ${updateDataPOList.length}`);

            await this.poRepository.update(
              {
                id: element.id,
              },
              element,
            );
          }
        }

        //update data PO Invoice
        if (updateDataPOExistingInvoiceList.length > 0) {
          let ipo = 0;
          for (const element of updateDataPOExistingInvoiceList) {
            ipo++;
            console.log(
              `update Invoice PO ${ipo} of ${updateDataPOExistingInvoiceList.length}`,
            );
            await this.poiRepository.update(
              {
                id: element.id,
              },
              element,
            );
          }
        }

        //insert new data PO Invoice
        if (insertedDataPOExistingInvoiceList.length > 0) {
          console.log(
            `insert PO invoice total ${insertedDataPOExistingInvoiceList.length}`,
          );
          await this.poiRepository.save(insertedDataPOExistingInvoiceList, {
            chunk: 1000,
          });
        }

        console.log('start check invoice');

        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }

        const successMessage = `Berhasil menambah ${totalInsertPO} po, mengupdate ${totalUpdatePO} po, menambah ${totalInsertESAR} ESAR, mengupdate ${totalUpdateESAR} ESAR, menambah ${totalInsertInvoice} invoice, mengupdate ${totalUpdateInvoice} invoice`;

        await this.activityLogService.create({
          user_id: user.id,
          description: successMessage,
          ip: ip,
        });

        return successResponse(null, successMessage);
      } else {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        throw new Error(`Sheet 'Detail' tidak ditemukan`);
      }
    } catch (err) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      if (err instanceof HttpException && err.getStatus() === HttpStatus.CONFLICT) {
        throw err;
      }

      console.log(err.message);
      console.log(err.stack);

      throw failedResponse(
        HttpStatus.BAD_REQUEST,
        `${err.message} at line ${line}`,
      );
    }
  }

  async validateInvoicePOData(excelData: any, dbData: any, poData: any, hasESARCols = true, hasInvCols = true) {
    const updateData: any = {};

    // ---- INVOICE FIELDS (only if file has invoice columns) ----
    if (hasInvCols) {
      //check invoice number
      if (
        excelData.invoice_number != null &&
        excelData.invoice_number != '' &&
        dbData.invoice_number != excelData.invoice_number
      ) {
        updateData.invoice_number = excelData.invoice_number;
      }

      //check invoice date
      if (
        excelData.invoice_date != null &&
        (!dbData.invoice_date || moment(dbData.invoice_date).format('YYYY-MM-D') != moment(excelData.invoice_date).format('YYYY-MM-D'))
      ) {
        updateData.invoice_date = excelData.invoice_date;
      }

      //check invoice status
      if (
        excelData.invoice_status &&
        dbData.invoice_status != excelData.invoice_status
      ) {
        updateData.invoice_status = excelData.invoice_status;
      }

      //check payment date
      if (
        excelData.payment_date != null &&
        (!dbData.payment_date || moment(dbData.payment_date).format('YYYY-MM-D') != moment(excelData.payment_date).format('YYYY-MM-D'))
      ) {
        updateData.payment_date = excelData.payment_date;
      }

      //check supplier tax number
      if (
        excelData.supplier_tax_number &&
        dbData.supplier_tax_number != excelData.supplier_tax_number
      ) {
        updateData.supplier_tax_number = excelData.supplier_tax_number;
      }

      //check supplier tax date
      if (
        excelData.supplier_tax_date != null &&
        (!dbData.supplier_tax_date || moment(dbData.supplier_tax_date).format('YYYY-MM-D') != moment(excelData.supplier_tax_date).format('YYYY-MM-D'))
      ) {
        updateData.supplier_tax_date = excelData.supplier_tax_date;
      }

      //check payment amount
      if (
        excelData.payment_amount != null &&
        dbData.payment_amount != excelData.payment_amount
      ) {
        updateData.payment_amount = isNaN(Number(excelData.payment_amount)) ? 0 : Number(excelData.payment_amount);
      }

      //check deduction amount
      if (
        excelData.deduction_amount != null &&
        dbData.deduction_amount != excelData.deduction_amount
      ) {
        updateData.deduction_amount = isNaN(Number(excelData.deduction_amount)) ? 0 : Number(excelData.deduction_amount);
      }
    }

    // ---- ESAR FIELDS (only if file has ESAR columns) ----
    if (hasESARCols) {
      //check unit price
      if (
        excelData.unit_price != null &&
        dbData.unit_price != excelData.unit_price
      ) {
        updateData.unit_price = isNaN(Number(excelData.unit_price)) ? 0 : Number(excelData.unit_price);
      }

      //check submit date
      if (
        excelData.submit_date != null &&
        (!dbData.submit_date || moment(dbData.submit_date).format('YYYY-MM-D') != moment(excelData.submit_date).format('YYYY-MM-D'))
      ) {
        updateData.submit_date = excelData.submit_date;
      }

      //check submit amount
      if (
        excelData.submit_amount != null &&
        dbData.submit_amount != excelData.submit_amount
      ) {
        updateData.submit_amount = isNaN(Number(excelData.submit_amount)) ? 0 : Number(excelData.submit_amount);
      }

      //check approve date
      if (
        excelData.approve_date != null &&
        (!dbData.approve_date || moment(dbData.approve_date).format('YYYY-MM-D') != moment(excelData.approve_date).format('YYYY-MM-D'))
      ) {
        updateData.approve_date = excelData.approve_date;
      }

      //check approve amount
      if (
        excelData.approve_amount != null &&
        dbData.approve_amount != excelData.approve_amount
      ) {
        updateData.approve_amount = isNaN(Number(excelData.approve_amount)) ? 0 : Number(excelData.approve_amount);
      }
    }

    //check position (always)
    if (excelData.position != null && dbData.position != excelData.position) {
      updateData.position = isNaN(Number(excelData.position)) ? 0 : Number(excelData.position);
    }

    return updateData;
  }

  async validateUserData(excelData: any, dbData: any) {
    const updateData: any = {};
    //check region
    if (
      excelData['region office'] &&
      dbData.region != excelData['region office']
    ) {
      updateData.region = excelData['region office'];
    }

    //check gm region
    if (excelData['gm region'] && dbData.gm_region != excelData['gm region']) {
      updateData.gm_region = excelData['gm region'];
    }

    //check company
    if (
      excelData['subcont company'] &&
      dbData.company != excelData['subcont company']
    ) {
      updateData.company = excelData['subcont company'];
    }

    //check category
    if (excelData['position'] && dbData.category != excelData['position']) {
      updateData.category = excelData['position'];
    }

    //check name
    if (
      excelData['resource name'] &&
      dbData.name != excelData['resource name']
    ) {
      updateData.name = excelData['resource name'];
    }

    //check email
    const rawEmailUpdate = typeof excelData['email'] === 'string' ? excelData['email'].trim() : excelData['email'];
    if (rawEmailUpdate && dbData.email != rawEmailUpdate) {
      updateData.email = rawEmailUpdate;
    }

    //check phone
    if (
      excelData['phone number'] &&
      dbData.phone != excelData['phone number']
    ) {
      updateData.phone = excelData['phone number'].replace(/[^0-9]/g, '');
    }

    //check position
    if (excelData['hak access']) {
      const position = await this.getEmployeePositionByName(
        excelData['hak access'],
      );
      if (dbData.employee_position_id != position.id) {
        updateData.employee_position_id = position.id;
      }
    }

    //check team number
    if (
      excelData['employee id'] &&
      dbData.team_number != excelData['employee id']
    ) {
      updateData.team_number = excelData['employee id'];
    }

    //check uniportal account
    if (
      excelData['uniportal account'] &&
      dbData.uniportal_account != excelData['uniportal account']
    ) {
      updateData.uniportal_account = excelData['uniportal account'];
    }

    //check project
    if (excelData['join date'] && dbData.project != excelData['join date']) {
      updateData.project = excelData['join date'];
    }

    //check remark employee status
    const excelStatus = typeof excelData['remark employee status'] === 'string' 
      ? excelData['remark employee status'].trim().toLowerCase() 
      : '';
    const dbStatusStr = typeof dbData.status_description === 'string' 
      ? dbData.status_description.trim().toLowerCase() 
      : '';

    if (
      excelData['remark employee status'] &&
      dbStatusStr !== excelStatus
    ) {
      updateData.status = excelStatus === 'on board' ? true : false;
      updateData.status_description = excelStatus || null;
    }

    //check pass id number
    if (
      excelData['pass id number'] &&
      dbData.pass_id_number != excelData['pass id number']
    ) {
      updateData.pass_id_number = excelData['pass id number'];
    }

    //check cyber security status
    if (
      excelData['cyber security status'] &&
      dbData.cyber_security_status != excelData['cyber security status']
    ) {
      updateData.cyber_security_status = excelData['cyber security status'];
    }

    //check status karyawan
    if (
      excelData['status karyawan'] &&
      dbData.level_iresource != excelData['status karyawan']
    ) {
      updateData.level_iresource = excelData['status karyawan'];
    }

    //check wah certification number
    if (
      excelData['wah certification number'] &&
      dbData.wah_certification_number != excelData['wah certification number']
    ) {
      updateData.wah_certification_number =
        excelData['wah certification number'];
    }

    //check wah validation end date
    if (
      dbData.wah_validation_end_date &&
      moment(excelData['wah validation end date'], moment.ISO_8601).isValid() &&
      moment(dbData.wah_validation_end_date).format('YYYY-MM-D') !=
      moment(excelData['wah validation end date']).format('YYYY-MM-D')
    ) {
      updateData.wah_validation_end_date = excelData['wah validation end date'];
    }

    //check electrical certification number
    if (
      excelData['electrical certification number'] &&
      dbData.electrical_certification_number !=
      excelData['electrical certification number']
    ) {
      updateData.electrical_certification_number =
        excelData['electrical certification number'];
    }

    //check electrical validation end date
    if (
      dbData.electrical_validation_end_date &&
      moment(
        excelData['electrical validation end date'],
        moment.ISO_8601,
      ).isValid() &&
      moment(dbData.electrical_validation_end_date).format('YYYY-MM-D') !=
      moment(excelData['electrical validation end date']).format('YYYY-MM-D')
    ) {
      updateData.electrical_validation_end_date =
        excelData['electrical validation end date'];
    }

    //check first aid certification number
    if (
      excelData['first aid certification number'] &&
      dbData.firstaid_certification_number !=
      excelData['first aid certification number']
    ) {
      updateData.firstaid_certification_number =
        excelData['first aid certification number'];
    }

    //check first aid validation end date
    if (
      dbData.firstaid_validation_end_date &&
      moment(
        excelData['first aid validation end date'],
        moment.ISO_8601,
      ).isValid() &&
      moment(dbData.firstaid_validation_end_date).format('YYYY-MM-D') !=
      moment(excelData['first aid validation end date']).format('YYYY-MM-D')
    ) {
      updateData.firstaid_validation_end_date =
        excelData['first aid validation end date'];
    }

    //check nomor rekening
    if (
      excelData['nomor rekening'] &&
      dbData.bank_account_number != excelData['nomor rekening']
    ) {
      updateData.bank_account_number = excelData['nomor rekening'];
    }

    //check nama bank
    if (excelData['nama bank'] && dbData.bank != excelData['nama bank']) {
      updateData.bank = excelData['nama bank'];
    }

    return updateData;
  }

  async validatePOData(excelData: any, dbData: any) {
    const updateData: any = {};

    //check cc
    if (excelData['cc'] && dbData.cc != excelData['cc']) {
      updateData.cc = excelData['cc'];
    }

    //check line po status
    const linePOStatus = excelData['line po status'] == 'Active' ? 1 : 0;

    if (excelData['line po status'] && linePOStatus != dbData.line_po_status) {
      updateData.line_po_status =
        excelData['line po status'] == 'Active' ? 1 : 0;
    }

    //check line po number
    if (
      excelData['po line no.'] &&
      dbData.line_po_number != excelData['po line no.']
    ) {
      updateData.line_po_number = excelData['po line no.'];
    }

    //check po number
    if (excelData['po no.'] && dbData.po_number != excelData['po no.']) {
      updateData.po_number = excelData['po no.'];
    }

    //check shipment number
    if (
      excelData['shipment no.'] &&
      dbData.shipment_number != excelData['shipment no.']
    ) {
      updateData.shipment_number = excelData['shipment no.'];
    }

    //check region
    if (excelData['region']) {
      const region = await this.getRegionByName(excelData['region']);
      if (dbData.region_id != region.id) {
        updateData.region_id = region.id;
      }
    }

    //check area
    if (excelData['area']) {
      const area = await this.getAreaByName(excelData['area']);
      if (dbData.area_id != area.id) {
        updateData.area_id = area.id;
      }
    }

    //check operator
    if (excelData['operator']) {
      const operator = await this.getOperatorByName(excelData['operator']);
      if (dbData.operator_id != operator.id) {
        updateData.operator_id = operator.id;
      }
    }

    //check customer
    if (excelData['customer']) {
      const customer = await this.getCustomerByName(excelData['customer']);
      if (dbData.customer_id != customer.id) {
        updateData.customer_id = customer.id;
      }
    }

    //check project
    if (excelData['project name'] && excelData['project code']) {
      const project = await this.getProjectByName(
        excelData['project name'],
        excelData['project code'],
      );
      if (dbData.project_id != project.id) {
        updateData.project_id = project.id;
      }
    }

    //check site
    if (excelData['site name'] && excelData['site code']) {
      const site = await this.getSiteByName(
        excelData['site name'],
        excelData['site code'],
      );
      if (dbData.site_id != site.id) {
        updateData.site_id = site.id;
      }
    }

    //check po status
    if (excelData['po status'] && dbData.status != excelData['po status']) {
      updateData.status = excelData['po status'];
    }

    //check item code
    if (excelData['item code'] && dbData.item_code != excelData['item code']) {
      updateData.item_code = excelData['item code'];
    }

    //check item description
    if (
      excelData['item description'] &&
      dbData.item_description != excelData['item description']
    ) {
      updateData.item_description = excelData['item description'];
    }

    //check item unit price
    if (
      excelData['unit price'] != null &&
      dbData.unit_price != excelData['unit price']
    ) {
      const intVal = isNaN(Number(excelData['unit price']))
        ? 0
        : Number(excelData['unit price']);

      if (dbData.unit_price != intVal) {
        updateData.unit_price = intVal;
      }
    }

    //check item unit price 1
    if (
      excelData['unit price 1 (100/60/70/80)'] != null &&
      dbData.unit_price_1 != excelData['unit price 1 (100/60/70/80)']
    ) {
      const intVal = isNaN(Number(excelData['unit price 1 (100/60/70/80)']))
        ? 0
        : Number(excelData['unit price 1 (100/60/70/80)']);

      if (dbData.unit_price_1 != intVal) {
        updateData.unit_price_1 = intVal;
      }
    }

    //check item unit price 2
    if (
      excelData['unit price 2 (20/30/40)'] != null &&
      dbData.unit_price_2 != excelData['unit price 2 (20/30/40)']
    ) {
      const intVal = isNaN(Number(excelData['unit price 2 (20/30/40)']))
        ? 0
        : Number(excelData['unit price 2 (20/30/40)']);

      if (dbData.unit_price_2 != intVal) {
        updateData.unit_price_2 = intVal;
      }
    }

    //check item requested qty
    if (
      excelData['requested qty'] != null &&
      dbData.requested_qty != excelData['requested qty']
    ) {
      const intVal = isNaN(Number(excelData['requested qty']))
        ? 0
        : Number(excelData['requested qty']);

      if (dbData.requested_qty != intVal) {
        updateData.requested_qty = intVal;
      }
    }

    //check item billed qty
    if (
      excelData['billed qty'] != null &&
      dbData.billed_qty != excelData['billed qty']
    ) {
      const intVal = isNaN(Number(excelData['billed qty']))
        ? 0
        : Number(excelData['billed qty']);

      if (dbData.billed_qty != intVal) {
        updateData.billed_qty = intVal;
      }
    }

    //check item due qty
    if (
      excelData['due qty'] != null &&
      dbData.due_qty != excelData['due qty']
    ) {
      const intVal = isNaN(Number(excelData['due qty']))
        ? 0
        : Number(excelData['due qty']);

      if (dbData.due_qty != intVal) {
        updateData.due_qty = intVal;
      }
    }

    //check item line amount
    if (
      excelData['line amount'] != null &&
      dbData.line_amount != excelData['line amount']
    ) {
      const intVal = isNaN(Number(excelData['line amount']))
        ? 0
        : Number(excelData['line amount']);

      if (dbData.line_amount != intVal) {
        updateData.line_amount = intVal;
      }
    }

    //check remaining from po
    if (
      excelData['remaining from po'] != null &&
      dbData.remaining_from_po != excelData['remaining from po']
    ) {
      const intVal = isNaN(Number(excelData['remaining from po']))
        ? 0
        : Number(excelData['remaining from po']);

      if (dbData.remaining_from_po != intVal) {
        updateData.remaining_from_po = intVal;
      }
    }

    //check unit
    if (excelData['unit'] && dbData.unit != excelData['unit']) {
      updateData.unit = excelData['unit'];
    }

    //check payment terms
    if (
      excelData['payment terms'] &&
      dbData.payment_terms != excelData['payment terms']
    ) {
      updateData.payment_terms = excelData['payment terms'];
    }

    //check bidding area
    if (excelData['bidding area']) {
      const biddingArea = await this.getBiddingAreaByName(
        excelData['bidding area'],
      );
      if (dbData.bidding_area_id != biddingArea.id) {
        updateData.bidding_area_id = biddingArea.id;
      }
    }

    //check publish date
    if (
      dbData.publish_date &&
      moment(excelData['publish date'], moment.ISO_8601).isValid() &&
      moment(dbData.publish_date).format('YYYY-MM-D') !=
      moment(excelData['publish date']).format('YYYY-MM-D')
    ) {
      updateData.publish_date = excelData['publish date'];
    }

    //check start date
    if (
      dbData.start_date &&
      moment(excelData['start date'], moment.ISO_8601).isValid() &&
      moment(dbData.start_date).format('YYYY-MM-D') !=
      moment(excelData['start date']).format('YYYY-MM-D')
    ) {
      updateData.start_date = excelData['start date'];
    }

    //check end date
    if (
      dbData.end_date &&
      moment(excelData['end date'], moment.ISO_8601).isValid() &&
      moment(dbData.end_date).format('YYYY-MM-D') !=
      moment(excelData['end date']).format('YYYY-MM-D')
    ) {
      updateData.end_date = excelData['end date'];
    }

    //check priority esar approve
    if (
      excelData['priority esar approve'] &&
      dbData.priority_esar_approve != excelData['priority esar approve']
    ) {
      updateData.priority_esar_approve = excelData['priority esar approve'];
    }

    //check remark weekly
    if (
      excelData['remark weekly'] &&
      dbData.remark_weekly != excelData['remark weekly']
    ) {
      updateData.remark_weekly = excelData['remark weekly'];
    }

    //check remark project
    if (excelData['remark project']) {
      const remarkProject = await this.getRemarkProjectByName(
        excelData['remark project'],
      );
      if (dbData.remark_project_id != remarkProject.id) {
        updateData.remark_project_id = remarkProject.id;
      }
    }

    //check pending type
    if (excelData['pending type']) {
      const pendingType = await this.getPendingTypeByName(
        excelData['pending type'],
      );
      if (dbData.pending_type_id != pendingType.id) {
        updateData.pending_type_id = pendingType.id;
      }
    }

    //check status of acceptance
    if (excelData['status of acceptance']) {
      const statusAcceptance = await this.getStatusAcceptanceByName(
        excelData['status of acceptance'],
      );
      if (dbData.status_acceptance_id != statusAcceptance.id) {
        updateData.status_acceptance_id = statusAcceptance.id;
      }
    }

    //check pending approval pd
    if (
      excelData['pending approval pd'] &&
      dbData.pending_approval_pd != excelData['pending approval pd']
    ) {
      updateData.pending_approval_pd = excelData['pending approval pd'];
    }

    //check amount pending approval pd
    if (
      excelData['amount pending approval pd'] != null &&
      dbData.amount_pending_approval_pd !=
      excelData['amount pending approval pd']
    ) {
      const intVal = isNaN(Number(excelData['amount pending approval pd']))
        ? 0
        : Number(excelData['amount pending approval pd']);

      if (dbData.amount_pending_approval_pd != intVal) {
        updateData.amount_pending_approval_pd = intVal;
      }
    }

    //check pd
    if (excelData['pd name']) {
      const pd = await this.getPDByName(excelData['pd name']);
      if (dbData.pd_id != pd.id) {
        updateData.pd_id = pd.id;
      }
    }

    //check actual completion date vs to pd
    if (
      excelData['actual completion date vs to pd'] &&
      moment(
        excelData['actual completion date vs to pd'],
        moment.ISO_8601,
      ).isValid() &&
      moment(dbData.actual_completion_date).format('YYYY-MM-D') !=
      moment(excelData['actual completion date vs to pd']).format('YYYY-MM-D')
    ) {
      updateData.actual_completion_date =
        excelData['actual completion date vs to pd'];
    }

    //check ready invoice
    if (
      excelData['ready invoice'] &&
      dbData.ready_invoice != excelData['ready invoice']
    ) {
      updateData.ready_invoice = excelData['ready invoice'];
    }

    //check amount ready invoice
    if (
      excelData['amount ready invoice'] != null &&
      dbData.amount_ready_invoice != excelData['amount ready invoice']
    ) {
      const intVal = isNaN(Number(excelData['amount ready invoice']))
        ? 0
        : Number(excelData['amount ready invoice']);

      if (dbData.amount_ready_invoice != intVal) {
        updateData.amount_ready_invoice = intVal;
      }
    }

    //check remark highlight
    if (
      excelData['remark highlight'] &&
      dbData.remark_highlight != excelData['remark highlight']
    ) {
      updateData.remark_highlight = excelData['remark highlight'];
    }

    //check budget percentage
    if (
      excelData['budget percentage'] != null &&
      dbData.budget_percentage != excelData['budget percentage']
    ) {
      const intVal = isNaN(Number(excelData['budget percentage']))
        ? 0
        : Number(excelData['budget percentage']);

      if (dbData.budget_percentage != intVal) {
        updateData.budget_percentage = intVal;
      }
    }

    //check ny invoice
    if (
      excelData['ny invoice'] != null &&
      dbData.ny_invoice != excelData['ny invoice']
    ) {
      const intVal = isNaN(Number(excelData['ny invoice']))
        ? 0
        : Number(excelData['ny invoice']);

      if (dbData.ny_invoice != intVal) {
        updateData.ny_invoice = intVal;
      }
    }

    //check ny invoice date
    if (
      excelData['ny invoice date'] &&
      moment(excelData['ny invoice date'], moment.ISO_8601).isValid() &&
      moment(dbData.ny_invoice_date).format('YYYY-MM-D') !=
      moment(excelData['ny invoice date']).format('YYYY-MM-D')
    ) {
      updateData.ny_invoice_date = excelData['ny invoice date'];
    }
    // PIUTANG IS AUTO CALCULATED, IGNORE EXCEL INPUT
    /*
    //check piutang
    if (
      excelData['piutang'] != null &&
      dbData.piutang != excelData['piutang']
    ) {
      const intVal = isNaN(Number(excelData['piutang']))
        ? 0
        : Number(excelData['piutang']);

      if (dbData.piutang != intVal) {
        updateData.piutang = intVal;
      }
    }
    */

    //check priority site list
    if (
      excelData['priority site list'] &&
      dbData.priority_site_list != excelData['priority site list']
    ) {
      updateData.priority_site_list = excelData['priority site list'];
    }

    //check amount priority
    if (
      excelData['amount priority'] != null &&
      dbData.amount_priority != excelData['amount priority']
    ) {
      const intVal = isNaN(Number(excelData['amount priority']))
        ? 0
        : Number(excelData['amount priority']);

      if (dbData.amount_priority != intVal) {
        updateData.amount_priority = intVal;
      }
    }

    //check achievement priority
    if (
      excelData['achievement priority'] != null &&
      dbData.achievement_priority != excelData['achievement priority']
    ) {
      const intVal = isNaN(Number(excelData['achievement priority']))
        ? 0
        : Number(excelData['achievement priority']);

      if (dbData.achievement_priority != intVal) {
        updateData.achievement_priority = intVal;
      }
    }

    //check actual bulan pengerjaan
    if (
      excelData['actual bulan pengerjaan'] &&
      moment(excelData['actual bulan pengerjaan'], moment.ISO_8601).isValid() &&
      moment(dbData.actual_work_date).format('YYYY-MM-D') !=
      moment(excelData['actual bulan pengerjaan']).format('YYYY-MM-D')
    ) {
      // updateData.actual_work_date = excelData['actual bulan pengerjaan'];
      updateData.actual_work_date = moment(
        excelData['actual bulan pengerjaan'],
      ).format('YYYY-MM-D');
    }

    //check actual nilai pengerjaan
    if (
      excelData['actual nilai pengerjaan'] != null &&
      dbData.actual_work_amount != excelData['actual nilai pengerjaan']
    ) {
      const intVal = isNaN(Number(excelData['actual nilai pengerjaan']))
        ? 0
        : Number(excelData['actual nilai pengerjaan']);

      if (dbData.actual_work_amount != intVal) {
        updateData.actual_work_amount = intVal;
      }
    }

    //check status actual bulan pengerjaan
    if (
      excelData['status actual bulan pengerjaan'] &&
      dbData.actual_work_status != excelData['status actual bulan pengerjaan']
    ) {
      updateData.actual_work_status =
        excelData['status actual bulan pengerjaan'];
    }

    //check remark highlight rekon
    if (
      excelData['remark highlight rekon'] &&
      dbData.remark_highlight_recon != excelData['remark highlight rekon']
    ) {
      updateData.remark_highlight_recon = excelData['remark highlight rekon'];
    }

    //check pic
    if (excelData['pic']) {
      const pic = await this.getUserByName(excelData['pic']);
      if (pic != null && pic != undefined && dbData.pic != pic.id) {
        updateData.pic = pic.id;
      }
    }

    //check plan date
    if (
      excelData['plan date'] &&
      moment(excelData['plan date'], moment.ISO_8601).isValid() &&
      moment(dbData.plan_date).format('YYYY-MM-D') !=
      moment(excelData['plan date']).format('YYYY-MM-D')
    ) {
      updateData.plan_date = excelData['plan date'];
    }

    return updateData;
  }

  async getEmployeePositionByName(name: string) {
    let employeePosition = this.employeePositionData.find((data) => {
      return data.name.toLowerCase() == name.toLowerCase();
    });

    if (!employeePosition) {
      const newemployeePositionData = new EmployeePosition();
      newemployeePositionData.name = name;
      employeePosition = await this.employeePositionRepository.save(
        newemployeePositionData,
      );
      await this.employeePositionData.push(employeePosition);
    }

    return employeePosition;
  }

  async getRegionByName(name: string) {
    let region = this.regionData.find((data) => {
      return data.name.toLowerCase() == name.toLowerCase();
    });

    if (!region) {
      const newRegionData = new Region();
      newRegionData.name = name;
      region = await this.regionRepository.save(newRegionData);
      await this.regionData.push(region);
    }

    return region;
  }

  async getAreaByName(name: string) {
    let area = this.areaData.find((data) => {
      return data.name.toLowerCase() == name.toLowerCase();
    });

    if (!area) {
      const newAreaData = new Area();
      newAreaData.name = name;
      area = await this.areaRepository.save(newAreaData);
      await this.areaData.push(area);
    }

    return area;
  }

  async getOperatorByName(name: string) {
    let operator = this.operatorData.find((data) => {
      return data.name.toLowerCase() == name.toLowerCase();
    });

    if (!operator) {
      const newoperatorData = new Operator();
      newoperatorData.name = name;
      operator = await this.operatorRepository.save(newoperatorData);
      await this.operatorData.push(operator);
    }

    return operator;
  }

  async getCustomerByName(name: string) {
    let customer = this.customerData.find((data) => {
      return data.name.toLowerCase() == name.toLowerCase();
    });

    if (!customer) {
      const newcustomerData = new Customer();
      newcustomerData.name = name;
      customer = await this.customerRepository.save(newcustomerData);
      await this.customerData.push(customer);
    }

    return customer;
  }

  async getBiddingAreaByName(name: string) {
    let biddingArea = this.biddingAreaData.find((data) => {
      return data.name.toLowerCase() == name.toLowerCase();
    });

    if (!biddingArea) {
      const newbiddingAreaData = new BiddingArea();
      newbiddingAreaData.name = name;
      biddingArea = await this.biddingAreaRepository.save(newbiddingAreaData);
      await this.biddingAreaData.push(biddingArea);
    }

    return biddingArea;
  }

  async getRemarkProjectByName(name: string) {
    let remarkProject = this.remarkProjectData.find((data) => {
      return data.name.toLowerCase() == name.toLowerCase();
    });

    if (!remarkProject) {
      const newremarkProjectData = new RemarkProject();
      newremarkProjectData.name = name;
      remarkProject = await this.remarkProjectRepository.save(
        newremarkProjectData,
      );
      await this.remarkProjectData.push(remarkProject);
    }

    return remarkProject;
  }

  async getStatusAcceptanceByName(name: string) {
    let statusAcceptance = this.statusAcceptanceData.find((data) => {
      return data.name.toLowerCase() == name.toLowerCase();
    });

    if (!statusAcceptance) {
      const newstatusAcceptanceData = new StatusAcceptance();
      newstatusAcceptanceData.name = name;
      statusAcceptance = await this.statusAcceptanceRepository.save(
        newstatusAcceptanceData,
      );
      await this.statusAcceptanceData.push(statusAcceptance);
    }

    return statusAcceptance;
  }

  async getPendingTypeByName(name: string) {
    let pendingType = this.pendingTypeData.find((data) => {
      return data.name.toLowerCase() == name.toLowerCase();
    });

    if (!pendingType) {
      const newpendingTypeData = new PendingType();
      newpendingTypeData.name = name;
      pendingType = await this.pendingTypeRepository.save(newpendingTypeData);
      await this.pendingTypeData.push(pendingType);
    }

    return pendingType;
  }

  async getPDByName(name: string) {
    let pd = this.pdData.find((data) => {
      return data.name.toLowerCase() == name.toLowerCase();
    });

    if (!pd) {
      const newpdData = new PD();
      newpdData.name = name;
      pd = await this.pdRepository.save(newpdData);
      await this.pdData.push(pd);
    }

    return pd;
  }

  async getProjectByName(name: string, code: string) {
    let project = this.projectData.find((data) => {
      return data.name.toLowerCase() == name.toLowerCase() && data.code == code;
    });

    if (!project) {
      const newprojectData = new Project();
      newprojectData.name = name;
      newprojectData.code = code;
      project = await this.projectRepository.save(newprojectData);
      await this.projectData.push(project);
    }

    return project;
  }

  async getSiteByName(name: string, code: string) {
    let site = this.siteData.find((data) => {
      return data.name.toLowerCase() == name.toLowerCase() && data.code == code;
    });

    if (!site) {
      const newsiteData = new Site();
      newsiteData.name = name;
      newsiteData.code = code;
      site = await this.siteRepository.save(newsiteData);
      await this.siteData.push(site);
    }

    return site;
  }

  async getUserByName(name: string) {
    if (name == undefined || name == null) {
      return null;
    }

    const user = this.userData.find((data) => {
      return data.name.toLowerCase() == name.toLowerCase();
    });

    return user;
  }

  async getExistingMasterData() {
    this.regionData = await getManager().query(
      `SELECT * FROM regions WHERE deleted_at IS NULL`,
    );

    this.operatorData = await getManager().query(
      `SELECT * FROM operators WHERE deleted_at IS NULL`,
    );

    this.areaData = await getManager().query(
      `SELECT * FROM areas WHERE deleted_at IS NULL`,
    );

    this.customerData = await getManager().query(
      `SELECT * FROM customers WHERE deleted_at IS NULL`,
    );

    this.projectData = await getManager().query(
      `SELECT * FROM projects WHERE deleted_at IS NULL`,
    );

    this.siteData = await getManager().query(
      `SELECT * FROM sites WHERE deleted_at IS NULL`,
    );

    this.biddingAreaData = await getManager().query(
      `SELECT * FROM bidding_areas WHERE deleted_at IS NULL`,
    );

    this.remarkProjectData = await getManager().query(
      `SELECT * FROM remark_projects WHERE deleted_at IS NULL`,
    );

    this.statusAcceptanceData = await getManager().query(
      `SELECT * FROM status_acceptances WHERE deleted_at IS NULL`,
    );

    this.pendingTypeData = await getManager().query(
      `SELECT * FROM pending_types WHERE deleted_at IS NULL`,
    );

    this.pdData = await getManager().query(
      `SELECT * FROM pd WHERE deleted_at IS NULL`,
    );

    this.userData = await getManager().query(
      `SELECT * FROM users WHERE deleted_at IS NULL`,
    );
  }
}
