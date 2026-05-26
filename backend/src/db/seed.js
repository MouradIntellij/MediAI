import bcrypt from "bcryptjs";
import { pool, query, transaction } from "../config/db.js";

async function upsertUser({ fullName, email, password, role }) {
  const passwordHash = await bcrypt.hash(password, 12);
  const { rows } = await query(
    `INSERT INTO users (full_name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email)
     DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role
     RETURNING id, full_name, email, role`,
    [fullName, email, passwordHash, role]
  );
  return rows[0];
}

async function seed() {
  await transaction(async (client) => {
    const admin = await upsertUser({
      fullName: "Admin MediAI",
      email: "admin@mediai.local",
      password: "Password123!",
      role: "admin"
    });
    const doctor = await upsertUser({
      fullName: "Dr. Sarah Benali",
      email: "doctor@mediai.local",
      password: "Password123!",
      role: "doctor"
    });
    const nurse = await upsertUser({
      fullName: "Nora Tremblay",
      email: "nurse@mediai.local",
      password: "Password123!",
      role: "nurse"
    });

    const { rows: patientRows } = await client.query(
      `INSERT INTO patients
       (first_name, last_name, date_of_birth, sex, phone, email, allergies, chronic_conditions, emergency_contact)
       VALUES
       ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [
        "Marc",
        "Dubois",
        "1962-03-14",
        "male",
        "+1 514 555 0190",
        "marc.dubois@example.com",
        ["penicillin"],
        ["hypertension", "diabetes"],
        { name: "Claire Dubois", phone: "+1 514 555 0123" }
      ]
    );

    const patientId =
      patientRows[0]?.id ||
      (
        await client.query(
          `SELECT id FROM patients WHERE first_name = 'Marc' AND last_name = 'Dubois' LIMIT 1`
        )
      ).rows[0].id;

    await client.query(
      `INSERT INTO appointments (patient_id, practitioner_id, starts_at, ends_at, status, reason)
       SELECT $1, $2, NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 30 minutes', 'confirmed', $3::text
       WHERE NOT EXISTS (
         SELECT 1
         FROM appointments
         WHERE patient_id = $1
           AND practitioner_id = $2
           AND reason = $3::text
           AND status <> 'cancelled'
       )`,
      [patientId, doctor.id, "Suivi hypertension et ajustement medicamenteux"]
    );

    await client.query(
      `INSERT INTO prescriptions
       (patient_id, practitioner_id, medication_name, dosage, frequency, start_date, instructions)
       SELECT $1, $2, $3::varchar, $4::varchar, $5::varchar, CURRENT_DATE, $6::text
       WHERE NOT EXISTS (
         SELECT 1
         FROM prescriptions
         WHERE patient_id = $1
           AND practitioner_id = $2
           AND medication_name = $3::varchar
           AND dosage = $4::varchar
           AND frequency = $5::varchar
           AND status = 'active'
       )`,
      [
        patientId,
        doctor.id,
        "Lisinopril",
        "10 mg",
        "1 fois par jour",
        "Prendre le matin, surveiller la tension."
      ]
    );

    await client.query(
      `INSERT INTO consultations
       (patient_id, practitioner_id, notes, diagnosis, vitals, ai_summary, ai_risk)
       SELECT $1, $2, $3::text, $4::text, $5::jsonb, $6::text, $7::jsonb
       WHERE NOT EXISTS (
         SELECT 1
         FROM consultations
         WHERE patient_id = $1
           AND practitioner_id = $2
           AND diagnosis = $4::text
       )`,
      [
        patientId,
        doctor.id,
        "Patient suivi pour hypertension et diabete. Tension controlee, adherence correcte au traitement.",
        "Suivi hypertension et diabete",
        { bloodPressure: "132/84", heartRate: 78 },
        "Controle cardiovasculaire stable avec surveillance metabolique recommandee.",
        { level: "medium", reasons: ["hypertension", "diabetes"] }
      ]
    );

    console.log("Seed complete");
    console.log("Demo accounts:");
    console.log("admin@mediai.local / Password123!");
    console.log("doctor@mediai.local / Password123!");
    console.log("nurse@mediai.local / Password123!");
    console.log(`Created users: ${admin.email}, ${doctor.email}, ${nurse.email}`);
  });

  await pool.end();
}

seed().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
