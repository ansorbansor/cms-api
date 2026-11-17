import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAtpTables1784256051731 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS atp_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        project_id INTEGER,
        customer_id INTEGER,
        structure_type VARCHAR(50) DEFAULT 'dual_end',
        version VARCHAR(20) DEFAULT '1.0',
        is_active BOOLEAN DEFAULT true,
        created_by INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE IF NOT EXISTS atp_template_sections (
        id SERIAL PRIMARY KEY,
        template_id INTEGER NOT NULL REFERENCES atp_templates(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        section_key VARCHAR(100) NOT NULL,
        section_type VARCHAR(50) NOT NULL,
        order_index INTEGER DEFAULT 0,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE IF NOT EXISTS atp_template_items (
        id SERIAL PRIMARY KEY,
        section_id INTEGER NOT NULL REFERENCES atp_template_sections(id) ON DELETE CASCADE,
        item_no VARCHAR(50),
        picture_no VARCHAR(50),
        label VARCHAR(255) NOT NULL,
        description TEXT,
        item_type VARCHAR(50) NOT NULL,
        severity VARCHAR(50) DEFAULT 'Minor',
        options JSONB,
        take_data_tag VARCHAR(255),
        take_data_template_item_id INTEGER REFERENCES take_data_template_items(id) ON DELETE SET NULL,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE IF NOT EXISTS atp_documents (
        id SERIAL PRIMARY KEY,
        doc_number VARCHAR(100) NOT NULL UNIQUE,
        template_id INTEGER NOT NULL REFERENCES atp_templates(id),
        project_id INTEGER,
        customer_id INTEGER,
        link_id VARCHAR(100),
        link_name VARCHAR(255),
        site_id_ne INTEGER,
        site_id_fe INTEGER,
        atp_date DATE,
        status VARCHAR(50) DEFAULT 'DRAFT',
        acceptance_status VARCHAR(50),
        punchlist_summary JSONB,
        created_by INTEGER,
        submitted_at TIMESTAMP WITH TIME ZONE,
        approved_at TIMESTAMP WITH TIME ZONE,
        share_token VARCHAR(100) UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE IF NOT EXISTS atp_document_values (
        id SERIAL PRIMARY KEY,
        document_id INTEGER NOT NULL REFERENCES atp_documents(id) ON DELETE CASCADE,
        template_item_id INTEGER NOT NULL REFERENCES atp_template_items(id),
        text_value TEXT,
        test_result VARCHAR(50),
        photo_id INTEGER,
        photo_url TEXT,
        take_data_submission_id INTEGER,
        remarks TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE IF NOT EXISTS atp_document_reviews (
        id SERIAL PRIMARY KEY,
        document_id INTEGER NOT NULL REFERENCES atp_documents(id) ON DELETE CASCADE,
        reviewer_role VARCHAR(100) NOT NULL,
        pic_name VARCHAR(255) NOT NULL,
        user_id INTEGER,
        status VARCHAR(50) NOT NULL,
        signature_url TEXT,
        remarks TEXT,
        signed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP WITH TIME ZONE
      );

      CREATE INDEX IF NOT EXISTS idx_atp_templates_proj ON atp_templates(project_id);
      CREATE INDEX IF NOT EXISTS idx_atp_templates_cust ON atp_templates(customer_id);
      CREATE INDEX IF NOT EXISTS idx_atp_sections_tpl ON atp_template_sections(template_id);
      CREATE INDEX IF NOT EXISTS idx_atp_items_sec ON atp_template_items(section_id);
      CREATE INDEX IF NOT EXISTS idx_atp_docs_tpl ON atp_documents(template_id);
      CREATE INDEX IF NOT EXISTS idx_atp_docs_status ON atp_documents(status);
      CREATE INDEX IF NOT EXISTS idx_atp_docs_token ON atp_documents(share_token);
      CREATE INDEX IF NOT EXISTS idx_atp_doc_val_doc ON atp_document_values(document_id);
      CREATE INDEX IF NOT EXISTS idx_atp_doc_rev_doc ON atp_document_reviews(document_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS atp_document_reviews CASCADE;
      DROP TABLE IF EXISTS atp_document_values CASCADE;
      DROP TABLE IF EXISTS atp_documents CASCADE;
      DROP TABLE IF EXISTS atp_template_items CASCADE;
      DROP TABLE IF EXISTS atp_template_sections CASCADE;
      DROP TABLE IF EXISTS atp_templates CASCADE;
    `);
  }
}
