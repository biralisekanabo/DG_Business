import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function getUserId(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

// GET company settings
export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await pool.query(
      `SELECT id, userid, company_name, phone, address, logo_url, signature_url, updated_at
       FROM company_settings WHERE userid = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Return empty settings template
      return NextResponse.json({
        company_name: null,
        phone: null,
        address: null,
        logo_url: null,
        signature_url: null,
        exists: false,
      });
    }

    return NextResponse.json({
      ...result.rows[0],
      exists: true,
    });
  } catch (error) {
    console.error("Error fetching company settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT update company settings
export async function PUT(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { company_name, phone, address } = await req.json();

    // First check if settings exist
    const checkResult = await pool.query(
      `SELECT id FROM company_settings WHERE userid = $1`,
      [userId]
    );

    let result;
    if (checkResult.rows.length === 0) {
      // Insert new
      result = await pool.query(
        `INSERT INTO company_settings (userid, company_name, phone, address, updated_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         RETURNING id, userid, company_name, phone, address, logo_url, signature_url, updated_at`,
        [userId, company_name, phone, address]
      );
    } else {
      // Update existing
      result = await pool.query(
        `UPDATE company_settings 
         SET company_name = $1, phone = $2, address = $3, updated_at = CURRENT_TIMESTAMP
         WHERE userid = $4
         RETURNING id, userid, company_name, phone, address, logo_url, signature_url, updated_at`,
        [company_name, phone, address, userId]
      );
    }

    return NextResponse.json({
      ...result.rows[0],
      exists: true,
    });
  } catch (error) {
    console.error("Error updating company settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
