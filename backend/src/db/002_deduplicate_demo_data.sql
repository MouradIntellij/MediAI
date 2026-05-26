DELETE FROM appointments a
USING appointments b
WHERE a.id > b.id
  AND a.patient_id = b.patient_id
  AND a.practitioner_id = b.practitioner_id
  AND a.reason = b.reason
  AND a.status = b.status
  AND a.location = b.location;

DELETE FROM prescriptions a
USING prescriptions b
WHERE a.id > b.id
  AND a.patient_id = b.patient_id
  AND a.practitioner_id = b.practitioner_id
  AND a.medication_name = b.medication_name
  AND a.dosage = b.dosage
  AND a.frequency = b.frequency
  AND a.status = b.status;

DELETE FROM consultations a
USING consultations b
WHERE a.id > b.id
  AND a.patient_id = b.patient_id
  AND a.practitioner_id = b.practitioner_id
  AND a.diagnosis = b.diagnosis;

CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_practitioner_slot_active
  ON appointments(practitioner_id, starts_at)
  WHERE status <> 'cancelled';
