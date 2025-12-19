ALTER TABLE purchase_orders ADD COLUMN start_progress_confirmed_by_rpm VARCHAR(255);
COMMENT ON COLUMN purchase_orders.start_progress_confirmed_by_rpm IS 'Confirmation by RPM for Start Progress (YES/NO)';

ALTER TABLE purchase_orders ADD COLUMN finish_progress_confirmed_by_rpm VARCHAR(255);
COMMENT ON COLUMN purchase_orders.finish_progress_confirmed_by_rpm IS 'Confirmation by RPM for Finish Progress (YES/NO)';

ALTER TABLE purchase_orders ADD COLUMN done_atp_confirmed_by_rpm VARCHAR(255);
COMMENT ON COLUMN purchase_orders.done_atp_confirmed_by_rpm IS 'Confirmation by RPM for Done ATP (YES/NO)';

ALTER TABLE purchase_orders ADD COLUMN remark_rpm TEXT;
COMMENT ON COLUMN purchase_orders.remark_rpm IS 'Remark by RPM';
