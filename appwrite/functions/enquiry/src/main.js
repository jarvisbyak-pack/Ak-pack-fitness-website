const json = (statusCode, payload) => new Response(JSON.stringify(payload), {
  status: statusCode,
  headers: { "content-type": "application/json; charset=utf-8" }
});

export default async ({ req, res, log, error }) => {
  try {
    const config = {
      endpoint: process.env.APPWRITE_FUNCTION_API_ENDPOINT,
      projectId: process.env.APPWRITE_FUNCTION_PROJECT_ID,
      apiKey: process.env.APPWRITE_FUNCTION_API_KEY,
      databaseId: process.env.APPWRITE_DATABASE_ID,
      tableId: process.env.APPWRITE_ENQUIRIES_TABLE_ID
    };

    if (Object.values(config).some((value) => !value)) {
      error("Missing Appwrite function configuration.");
      return res.json({ ok: false, message: "Enquiry service is not configured." }, 503);
    }

    let body;
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body ?? {});
    } catch {
      return res.json({ ok: false, message: "Invalid request body." }, 400);
    }

    const name = String(body.name ?? "").trim().slice(0, 100);
    const phone = String(body.phone ?? "").trim().slice(0, 24);
    const interest = String(body.interest ?? "").trim().slice(0, 80);
    const preferredContact = String(body.preferredContact ?? "").trim().slice(0, 24);

    if (name.length < 2 || !/^[+0-9() .-]{7,24}$/.test(phone) || !interest) {
      return res.json({ ok: false, message: "Please provide a valid name, phone number and enquiry type." }, 400);
    }

    const rowId = crypto.randomUUID().replaceAll("-", "").slice(0, 32);
    const apiUrl = new URL(
      `tablesdb/${encodeURIComponent(config.databaseId)}/tables/${encodeURIComponent(config.tableId)}/rows`,
      config.endpoint.endsWith("/") ? config.endpoint : config.endpoint + "/"
    );

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-appwrite-project": config.projectId,
        "x-appwrite-key": config.apiKey
      },
      body: JSON.stringify({
        rowId,
        data: {
          name,
          phone,
          interest,
          preferredContact,
          status: "new",
          source: "website",
          createdAt: new Date().toISOString()
        }
      })
    });

    if (!response.ok) {
      const details = await response.text();
      error(`Appwrite row creation failed: ${response.status} ${details.slice(0, 500)}`);
      return res.json({ ok: false, message: "We could not save your enquiry. Please use WhatsApp instead." }, 502);
    }

    log(`Website enquiry saved: ${rowId}`);
    return res.json({ ok: true, enquiryId: rowId }, 201);
  } catch (err) {
    error(err?.stack ?? String(err));
    return res.json({ ok: false, message: "The enquiry service is temporarily unavailable." }, 500);
  }
};
