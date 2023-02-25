import { HttpStatus, Injectable } from '@nestjs/common';
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
import * as moment from 'moment';
import { PurchaseOrderInvoice } from 'src/entities/purchase-order-invoice.entity';
import { EmployeePosition } from 'src/entities/employee-position.entity';
import * as bcrypt from 'bcryptjs';
import { Role } from 'src/entities/role.entity';
import { UserRoles } from 'src/entities/user-role.entity';

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
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(UserRoles)
    private userRoleRepository: Repository<UserRoles>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private activityLogService: ActivityLogService,
  ) {}

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
  roleData = null;
  userRoleData = null;

  async importUser(file, user: User, ip: string) {
    if (!file) {
      throw failedResponse(HttpStatus.BAD_REQUEST, 'Harap kirimkan file');
    }

    try {
      const userData = await getManager().query(
        `SELECT * FROM users WHERE deleted_at IS NULL`,
      );
      this.userRoleData = await getManager().query(
        `SELECT * FROM user_roles WHERE deleted_at IS NULL`,
      );

      const workbook = xlsx.readFile(file.path);

      const worksheet = workbook.Sheets['Detail'];
      if (worksheet) {
        this.employeePositionData = await getManager().query(
          `SELECT * FROM employee_positions WHERE deleted_at IS NULL`,
        );

        this.roleData = await getManager().query(
          `SELECT * FROM roles WHERE deleted_at IS NULL`,
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
              (item) => item.nik === value['id number (ktp)'],
            );

            if (indexDataExisting > -1) {
              const updateData = await this.validateUserData(
                value,
                userData[indexDataExisting],
                this.userRoleData,
              );

              if (Object.keys(updateData).length > 0) {
                //add user to updated object and push to list
                updateData.id = userData[indexDataExisting].id;
                updateDataUserList.push(updateData);
              }
            } else {
              const inserUser = new User();
              inserUser.region = value['region 1'];
              inserUser.gm_region = value['gm region'];
              inserUser.company = value['subcont company'];
              inserUser.category = value['category'];
              inserUser.name = value['resource name'];
              inserUser.nik = value['id number (ktp)'];
              inserUser.email = value['email'];
              inserUser.phone = value['phone number']
                ? value['phone number'].replace(/[^0-9]/g, '')
                : null;
              inserUser.employee_position_id = value['position']
                ? (await this.getEmployeePositionByName(value['position'])).id
                : null;
              inserUser.team_number = value['team number'];
              inserUser.uniportal_account = value['uniportal account'];
              inserUser.project = value['project'];
              inserUser.status =
                value['employee status'] == 'On Board' ? true : false;
              inserUser.status_description = value['employee status'];
              inserUser.pass_id_number = value['pass id number'];
              inserUser.cyber_security_status = value['cyber security status'];
              inserUser.level_iresource = value['level in iresource'];
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

              const salt = await bcrypt.genSalt();
              inserUser.password = await bcrypt.hash('Password123', salt);

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
          const users = await this.userRepository.save(insertDataUserList, {
            chunk: 1000,
          });

          //insert user role
          const insertUserRole = [];
          for (const user of users) {
            const userRole = new UserRoles();
            userRole.role_id = await this.getEmployeeRoleByName(
              user.employeePosition.name,
            );
            userRole.user_id = user.id;
            insertUserRole.push(userRole);
          }

          if (insertUserRole.length > 0) {
            await this.userRoleRepository.save(insertUserRole, {
              chunk: 1000,
            });
          }

          successMessage += `menambah ${insertDataUserList.length} data Karyawan, `;
        }

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
    }
  }

  async importPO(file, user: User, ip: string) {
    if (!file) {
      throw failedResponse(HttpStatus.BAD_REQUEST, 'Harap kirimkan file');
    }

    try {
      const workbook = xlsx.readFile(file.path);
      const worksheet = workbook.Sheets['Detail'];
      if (worksheet) {
        await this.getExistingMasterData();

        let poData = await getManager().query(
          `SELECT * FROM purchase_orders WHERE deleted_at IS NULL`,
        );

        const poInvoiceData = await getManager().query(
          `SELECT 
          poi.id "poi_id",  
          po.id "po_id", 
          poi.invoice_number, 
          poi.invoice_date, 
          poi.invoice_date, 
          poi.invoice_status, 
          poi.payment_date, 
          poi.supplier_tax_number, 
          poi.supplier_tax_date, 
          poi.purchase_order_id,
          po.cc
        FROM 
          purchase_order_invoices poi, purchase_orders po
        WHERE 
          poi.deleted_at IS NULL AND 
          po.deleted_at IS NULL AND
          poi.purchase_order_id = po.id`,
        );

        const poCCData = poData.map((data) => {
          return data.cc ? data.cc : null;
        });
        const rowData = xlsx.utils.sheet_to_json(worksheet).map((row) =>
          Object.keys(row).reduce((obj, key) => {
            obj[key.trim().toLowerCase()] = isString(row[key.trim()])
              ? row[key].trim()
              : row[key];
            return obj;
          }, {}),
        );
        console.log('done rowData');

        const updateDataPOList = [];
        const insertDataPOList = [];
        const invoices = [];
        const updateDataPOInvoiceList = [];
        const insertDataPOInvoiceList = [];

        for (const [index, value] of rowData.entries()) {
          //validate cc exists
          if (value['cc'] && /^(?=.*[a-zA-Z])|(?=.*[0-9])/.test(value['cc'])) {
            //get list invoice
            for (const key of Object.keys(value)) {
              if (/^ac.*inv$/.test(key)) {
                const invNo = key.replace('ac', '').replace(' inv', '');
                invoices.push({
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
                });
              }
            }

            //check exists or new PO
            const indexDataExisting = poCCData.findIndex(
              (item) => item === value['cc'],
            );

            if (indexDataExisting > -1) {
              const updateData = await this.validatePOData(
                value,
                poData[indexDataExisting],
              );

              if (Object.keys(updateData).length > 0) {
                //add user to updated object and push to list
                updateData.user_id = user.id;
                updateData.id = poData[indexDataExisting].id;
                updateDataPOList.push(updateData);
              }
            } else {
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
              insertPO.customer_id = value['costomer']
                ? (await this.getCustomerByName(value['costomer'])).id
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
              insertPO.unit_price = value['unit price'];
              insertPO.unit_price_1 = value['unit price 1 (100/60/70/80)'];
              insertPO.unit_price_2 = value['unit price 2 (20/30/40)'];
              insertPO.requested_qty = value['requested qty'];
              insertPO.billed_qty = value['billed qty'];
              insertPO.due_qty = value['due qty'];
              insertPO.line_amount = value['line amount'];
              insertPO.remaining_from_po = value['remaining from po'];
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
              insertPO.amount_pending_approval_pd =
                value['amount pending approval pd'];
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
              insertPO.amount_ready_invoice = value['amount ready invoice'];
              insertPO.remark_highlight = value['remark highlight'];
              insertPO.budget_percentage = value['budget percentage'];

              insertDataPOList.push(insertPO);
            }
          }
        }
        console.log('done loop');

        let successMessage = 'Berhasil ';

        //update data PO
        if (updateDataPOList.length > 0) {
          for (const element of updateDataPOList) {
            await this.poRepository.update(
              {
                id: element.id,
              },
              element,
            );
          }
          successMessage += `mengupdate ${updateDataPOList.length} data PO, `;
        }

        //insert data new PO
        if (insertDataPOList.length > 0) {
          console.log(`insert ${insertDataPOList.length} data`);
          const newPO = await this.poRepository.save(insertDataPOList, {
            chunk: 1000,
          });
          poData = [...poData, ...newPO];

          successMessage += `menambah ${insertDataPOList.length} data PO, `;
        }

        console.log('start check invoice');
        for (const inv of invoices) {
          //check exists or new PO
          const indexDataExisting = poInvoiceData.findIndex(
            (item) =>
              item.invoice_number === inv.invoice_number && item.cc == inv.cc,
          );

          if (indexDataExisting > -1) {
            const updateData = await this.validateInvoicePOData(
              inv,
              poInvoiceData[indexDataExisting],
            );

            if (Object.keys(updateData).length > 0) {
              //add user to updated object and push to list
              updateData.user_id = user.id;
              updateData.id = poInvoiceData[indexDataExisting].id;
              updateDataPOInvoiceList.push(updateData);
            }
          } else {
            inv.purchase_order_id = poData.find((data) => {
              return data.cc === inv.cc;
            }).id;
            delete inv.cc;
            insertDataPOInvoiceList.push(inv);
          }
        }

        //update data PO Invoice
        if (updateDataPOInvoiceList.length > 0) {
          for (const element of updateDataPOInvoiceList) {
            await this.poiRepository.update(
              {
                id: element.id,
              },
              element,
            );
          }
          successMessage += `mengupdate ${updateDataPOInvoiceList.length} data Invoice PO, `;
        }

        //insert data new PO Invoice
        if (insertDataPOInvoiceList.length > 0) {
          console.log(`insert ${insertDataPOInvoiceList.length} data`);
          await this.poiRepository.save(insertDataPOInvoiceList, {
            chunk: 1000,
          });
          successMessage += `menambah ${insertDataPOInvoiceList.length} data Invoice PO, `;
        }

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
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw err;
    }
  }

  async validateInvoicePOData(excelData: any, dbData: any) {
    const updateData: any = {};

    //check invoice date
    if (
      dbData.invoice_date &&
      moment(dbData.invoice_date).format('YYYY-MM-D') !=
        moment(excelData.invoice_date).format('YYYY-MM-D')
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
      dbData.payment_date &&
      moment(dbData.payment_date).format('YYYY-MM-D') !=
        moment(excelData.payment_date).format('YYYY-MM-D')
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
      dbData.supplier_tax_date &&
      moment(dbData.supplier_tax_date).format('YYYY-MM-D') !=
        moment(excelData.supplier_tax_date).format('YYYY-MM-D')
    ) {
      updateData.supplier_tax_date = excelData.supplier_tax_date;
    }

    return updateData;
  }

  async validateUserData(excelData: any, dbData: any, userRoleData: any) {
    const updateData: any = {};
    //check region
    if (excelData['region 1'] && dbData.region != excelData['region 1']) {
      updateData.region = excelData['region 1'];
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
    if (excelData['category'] && dbData.category != excelData['category']) {
      updateData.category = excelData['category'];
    }

    //check name
    if (
      excelData['resource name'] &&
      dbData.name != excelData['resource name']
    ) {
      updateData.name = excelData['resource name'];
    }

    //check email
    if (excelData['email'] && dbData.email != excelData['email']) {
      updateData.email = excelData['email'];
    }

    //check phone
    if (
      excelData['phone number'] &&
      dbData.phone != excelData['phone number']
    ) {
      updateData.phone = excelData['phone number'].replace(/[^0-9]/g, '');
    }

    //check position
    if (excelData['position']) {
      const position = await this.getEmployeePositionByName(
        excelData['position'],
      );
      if (dbData.employee_position_id != position.id) {
        updateData.employee_position_id = position.id;
      }
    }

    //check team number
    if (
      excelData['team number'] &&
      dbData.team_number != excelData['team number']
    ) {
      updateData.team_number = excelData['team number'];
    }

    //check uniportal account
    if (
      excelData['uniportal account'] &&
      dbData.uniportal_account != excelData['uniportal account']
    ) {
      updateData.uniportal_account = excelData['uniportal account'];
    }

    //check project
    if (excelData['project'] && dbData.project != excelData['project']) {
      updateData.project = excelData['project'];
    }

    //check employee status
    if (
      excelData['employee status'] &&
      dbData.status_description != excelData['employee status']
    ) {
      updateData.status =
        excelData['employee status'] == 'On Board' ? true : false;
      updateData.status_description = excelData['employee status'];
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

    //check level in iresource
    if (
      excelData['level in iresource'] &&
      dbData.level_iresource != excelData['level in iresource']
    ) {
      updateData.level_iresource = excelData['level in iresource'];
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

    //check user role
    if (excelData['position']) {
      const role = await this.getEmployeeRoleByName(excelData['position']);
      const userRole = userRoleData.find((e) => {
        return e.user_id == dbData.id;
      });

      if (userRole && role.id != userRole.role_id) {
        console.log(`${role.id} | ${userRole.role_id}`);
        await getManager().query(
          `UPDATE user_roles SET role_id = ${role.id} WHERE role_id = ${userRole.role_id} AND user_id = ${dbData.id}`,
        );
      } else if (!userRole) {
        await getManager().query(
          `INSERT INTO user_roles(user_id, role_id) VALUES (${dbData.id}, ${role.id})`,
        );
        this.userRoleData.push({
          user_id: dbData.id,
          role_id: role.id,
        });
      }
    }

    return updateData;
  }

  async validatePOData(excelData: any, dbData: any) {
    const updateData: any = {};

    //check line po status
    const linePOStatus = dbData.line_po_status == 1 ? 'Active' : 'Inactive';

    if (
      excelData['line po status'] &&
      linePOStatus != excelData['line po status']
    ) {
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
    if (excelData['costomer']) {
      const customer = await this.getCustomerByName(excelData['costomer']);
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
      excelData['unit price'] &&
      dbData.unit_price != excelData['unit price']
    ) {
      updateData.unit_price = excelData['unit price'];
    }

    //check item unit price 1
    if (
      excelData['unit price 1 (100/60/70/80)'] &&
      dbData.unit_price_1 != excelData['unit price 1 (100/60/70/80)']
    ) {
      updateData.unit_price_1 = excelData['unit price 1 (100/60/70/80)'];
    }

    //check item unit price 2
    if (
      excelData['unit price 2 (20/30/40)'] &&
      dbData.unit_price_2 != excelData['unit price 2 (20/30/40)']
    ) {
      updateData.unit_price_2 = excelData['unit price 2 (20/30/40)'];
    }

    //check item requested qty
    if (
      excelData['requested qty'] &&
      dbData.requested_qty != excelData['requested qty']
    ) {
      updateData.requested_qty = excelData['requested qty'];
    }

    //check item billed qty
    if (
      excelData['billed qty'] &&
      dbData.billed_qty != excelData['billed qty']
    ) {
      updateData.billed_qty = excelData['billed qty'];
    }

    //check item due qty
    if (excelData['due qty'] && dbData.due_qty != excelData['due qty']) {
      updateData.due_qty = excelData['due qty'];
    }

    //check item line amount
    if (
      excelData['line amount'] &&
      dbData.line_amount != excelData['line amount']
    ) {
      updateData.line_amount = excelData['line amount'];
    }

    //check remaining from po
    if (
      excelData['remaining from po'] &&
      dbData.remaining_from_po != excelData['remaining from po']
    ) {
      updateData.remaining_from_po = excelData['remaining from po'];
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
      excelData['amount pending approval pd'] &&
      dbData.amount_pending_approval_pd !=
        excelData['amount pending approval pd']
    ) {
      updateData.amount_pending_approval_pd =
        excelData['amount pending approval pd'];
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
      excelData['amount ready invoice'] &&
      dbData.amount_ready_invoice != excelData['amount ready invoice']
    ) {
      updateData.amount_ready_invoice = excelData['amount ready invoice'];
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
      excelData['budget percentage'] &&
      dbData.budget_percentage != excelData['budget percentage']
    ) {
      updateData.budget_percentage = excelData['budget percentage'];
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

  async getEmployeeRoleByName(name: string) {
    let role = this.roleData.find((data) => {
      return data.name.toLowerCase() == name.toLowerCase();
    });

    if (!role) {
      const newRoleData = new Role();
      newRoleData.name = name;
      role = await this.roleRepository.save(newRoleData);
      await this.roleData.push(role);
    }

    return role;
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
  }
}
