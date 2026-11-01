# AK PACK Fitness — Appwrite backend

This backend is staged on the `appwrite-integration` branch. It does not change the live Spacefast site or GitHub Pages deployment.

## Planned resources

- Project: `AK PACK Fitness` (region `sgp`)
- Database: `akpack-main`
- Table: `enquiries`
- Function: `akpack-enquiry` (Node.js 24)
- Storage bucket: `akpack-media` (to be configured after the project exists)
- Web platform: the production website hostname and approved preview hostnames

## Enquiries table

Create these columns:

| Column | Type | Required | Notes |
|---|---|---:|---|
| name | varchar(100) | yes | Visitor name |
| phone | varchar(24) | yes | Contact number |
| interest | varchar(80) | yes | Enquiry category |
| preferredContact | varchar(24) | no | Selected gym contact number |
| status | varchar(20) | yes | Default `new`; admin-managed |
| source | varchar(30) | yes | `website` |
| createdAt | datetime | yes | ISO-8601 timestamp |

Keep table-level client permissions closed. The public website must not receive an Appwrite API key or direct write access to the table. Only the Function's server-side key should have the minimum `rows.write` scope. The Function should be executable by `any` because the public website is anonymous; it validates requests before inserting rows. Rate limiting is not implemented in the staged function yet; add an Appwrite WAF/rate-limit policy before production activation.

## Function environment

Configure these server-side variables for the Function:

- `APPWRITE_DATABASE_ID`
- `APPWRITE_ENQUIRIES_TABLE_ID`

The Appwrite Function runtime provides `APPWRITE_FUNCTION_API_ENDPOINT`, `APPWRITE_FUNCTION_PROJECT_ID`, and `APPWRITE_FUNCTION_API_KEY`. The function key must have only `rows.write` scope for the target database/table.

## Frontend configuration

After creating the Appwrite project and Function, fill in `assets/js/appwrite-config.js`:

- `endpoint`: Appwrite regional API endpoint
- `projectId`: public project ID
- `functionId`: public Function ID
- `enabled`: set to `true` only after the Function and schema are deployed and tested

Project IDs and Function IDs are public identifiers. Never put API keys, passwords, or server secrets in frontend files.

## Activation and verification checklist

1. Create the dedicated Appwrite project in Singapore.
2. Register the website hostname as a Web platform.
3. Create the database and table with the schema above.
4. Create and deploy the Node.js Function with the minimum required API key scope.
5. Add and verify rate limiting / abuse protection (not yet implemented in the staged function) and configure Function execution permissions.
6. Configure the frontend public identifiers.
7. Test valid submission, invalid phone, missing fields, duplicate submission, failure fallback, and mobile Safari.
8. Confirm records appear in Appwrite and WhatsApp handoff still works.
9. Only after explicit production approval, merge the branch and separately coordinate the Spacefast production update.

## Hosting boundary

The repository README states that this is a source backup of the Spacefast site. GitHub Pages is not the live production host. Do not merge this branch or treat a GitHub Pages deployment as a Spacefast deployment.
