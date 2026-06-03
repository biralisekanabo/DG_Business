import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

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

// POST upload logo
export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("logo") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const uploadDir = join(process.cwd(), "public", "uploads", "logos");
    
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // Directory might already exist
    }

    const filename = `logo-${userId}-${Date.now()}.${file.type.split("/")[1] || "png"}`;
    const filepath = join(uploadDir, filename);
    const publicPath = `/uploads/logos/${filename}`;

    await writeFile(filepath, Buffer.from(buffer));

    // Update database
    const checkResult = await pool.query(
      `SELECT id FROM company WHERE userid = $1`,
      [userId]
    );

    if (checkResult.rows.length === 0) {
      await pool.query(
        `INSERT INTO company (userid, logo_url)
         VALUES ($1, $2)`,
        [userId, publicPath]
      );
    } else {
      await pool.query(
        `UPDATE company SET logo_url = $1 WHERE userid = $2`,
        [publicPath, userId]
      );
    }

    return NextResponse.json({ logo_url: publicPath });
  } catch (error) {
    console.error("Error uploading logo:", error);
    return NextResponse.json(
      { error: "Failed to upload logo" },
      { status: 500 }
    );
  }
}

// DELETE logo
export async function DELETE(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await pool.query(
      `UPDATE company SET logo_url = NULL WHERE userid = $1`,
      [userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting logo:", error);
    return NextResponse.json(
      { error: "Failed to delete logo" },
      { status: 500 }
    );
  }
}
