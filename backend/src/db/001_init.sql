CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(30) NOT NULL CHECK (role IN ('admin', 'doctor', 'nurse', 'patient')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  first_name VARCHAR(120) NOT NULL,
  last_name VARCHAR(120) NOT NULL,
  date_of_birth DATE NOT NULL,
  sex VARCHAR(20) NOT NULL,
  phone VARCHAR(40),
  email VARCHAR(180) UNIQUE,
  address TEXT,
  allergies TEXT[] NOT NULL DEFAULT '{}',
  chronic_conditions TEXT[] NOT NULL DEFAULT '{}',
  emergency_contact JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
  reason TEXT NOT NULL,
  location VARCHAR(160) NOT NULL DEFAULT 'Clinique principale',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  notes TEXT NOT NULL,
  diagnosis TEXT,
  vitals JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_summary TEXT,
  ai_risk JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  medication_name VARCHAR(180) NOT NULL,
  dosage VARCHAR(120) NOT NULL,
  frequency VARCHAR(120) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  instructions TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reaction TEXT,
  adherence_status VARCHAR(30) NOT NULL DEFAULT 'taken'
    CHECK (adherence_status IN ('taken', 'missed', 'delayed', 'reaction')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id UUID,
  ip_address VARCHAR(80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_consultations_patient ON consultations(patient_id, created_at);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
