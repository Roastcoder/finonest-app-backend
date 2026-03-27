# RC Data Flow - Quick Reference Guide

## 🚀 Quick Start

### What Happens When User Fetches Vehicle Details?

1. **Frontend**: User enters RC number (e.g., `RJ14UK0001`) and clicks search
2. **API Call**: POST to `/rc-verification/verify` with `{ rc_number: "RJ14UK0001" }`
3. **Backend**: 
   - Checks `rc_cache` table first
   - If not found, calls Surepass API
   - Saves complete response to database
4. **Frontend**: Maps RC fields to form fields and populates form
5. **Database**: RC data stored in `rc_cache` table as JSONB

---

## 📊 Database Schema

```sql
-- RC Cache Table
CREATE TABLE rc_cache (
  id SERIAL PRIMARY KEY,
  rc_number VARCHAR(20) UNIQUE,      -- e.g., "RJ14UK0001"
  rc_data JSONB,                     -- Complete RC object
  challan_data JSONB,                -- Challan info
  api_type VARCHAR(20),              -- "non-masked" or "masked"
  created_at TIMESTAMP
);
```

---

## 🔍 Inspect Database

### View All Cached RCs
```bash
psql -U postgres -d car_credit_hub -c "SELECT rc_number, api_type, created_at FROM rc_cache ORDER BY created_at DESC LIMIT 10;"
```

### View Specific RC Data
```bash
psql -U postgres -d car_credit_hub -c "SELECT rc_data FROM rc_cache WHERE rc_number = 'RJ14UK0001';"
```

### Use Inspection Tool
```bash
node src/utils/inspectRCData.js RJ14UK0001
```

---

## 📋 RC Data Fields Saved in Database

| Field | Example | Type |
|-------|---------|------|
| `rc_number` | RJ14UK0001 | string |
| `vehicle_engine_number` | 1GDA049706 | string |
| `vehicle_chasi_number` | MBJGA3GS100370256 | string |
| `owner_name` | RISHI DEO LOYAL | string |
| `maker_description` | TOYOTA KIRLOSKAR MOTOR | string |
| `maker_model` | FORTUNER | string |
| `fuel_type` | DIESEL | string |
| `manufacturing_date` | 11/2016 | string |
| `insurance_company` | ICICI Lombard | string |
| `insurance_upto` | 2027-01-20 | date |
| `pucc_upto` | 2027-01-04 | date |
| `financer` | AU SMALL FIN BANK | string |
| `financed` | true | boolean |
| `permanent_address` | P.NO. 4 ASHOK VIHAR | string |
| `permanent_district` | Jaipur | string |
| `permanent_state` | Rajasthan | string |
| `permanent_pincode` | 302023 | string |

---

## 🔄 Field Mapping (RC → Form)

```javascript
// Backend saves this:
{
  vehicle_engine_number: "1GDA049706",
  vehicle_chasi_number: "MBJGA3GS100370256",
  owner_name: "RISHI DEO LOYAL",
  maker_description: "TOYOTA KIRLOSKAR MOTOR",
  maker_model: "FORTUNER",
  fuel_type: "DIESEL",
  manufacturing_date: "11/2016",
  insurance_company: "ICICI Lombard",
  insurance_upto: "2027-01-20",
  pucc_upto: "2027-01-04",
  financer: "AU SMALL FIN BANK",
  financed: true,
  permanent_address: "P.NO. 4 ASHOK VIHAR",
  permanent_district: "Jaipur",
  permanent_state: "Rajasthan",
  permanent_pincode: "302023"
}

// Frontend maps to form fields:
{
  engineNumber: "1GDA049706",
  chassisNumber: "MBJGA3GS100370256",
  ownerName: "RISHI DEO LOYAL",
  makerName: "TOYOTA KIRLOSKAR MOTOR",
  makerModel: "FORTUNER",
  fuelType: "DIESEL",
  manufacturingDate: "2016-11-01",  // Converted to YYYY-MM-DD
  insuranceCompany: "ICICI Lombard",
  insuranceValidUpto: "2027-01-20",
  puccValidUpto: "2027-01-04",
  financer: "AU SMALL FIN BANK",
  financeStatus: "Financed",
  currentAddress: "P.NO. 4 ASHOK VIHAR",
  currentDistrict: "Jaipur",
  currentState: "Rajasthan",
  currentPincode: "302023"
}
```

---

## 🐛 Troubleshooting

### Problem: Form fields not populating after fetching RC

**Check 1: Backend API Response**
```bash
# Look for these logs in backend console:
✅ RC RJ14UK0001 found in cache (non-masked)
💾 Saving RC RJ14UK0001 to database...
✅ RC RJ14UK0001 saved to cache (non-masked)
```

**Check 2: Frontend Console**
```javascript
// Open browser DevTools → Console
// Should see: "Applying RC data: {...}"
// Should see: "Vehicle details loaded from database!"
```

**Check 3: Database**
```bash
node src/utils/inspectRCData.js RJ14UK0001
# Should show all RC fields with values
```

---

### Problem: Dates showing in wrong format

**Expected**: `2016-11-01` (YYYY-MM-DD)
**Actual**: `11/2016` or `01-11-2016`

**Solution**: Check `convertDate()` function in `src/lib/rc-mapper.ts`

```javascript
// Should handle these formats:
"11/2016" → "2016-11-01"
"01/11/2016" → "2016-11-01"
"01-11-2016" → "2016-11-01"
"2016-11-01" → "2016-11-01"
```

---

### Problem: Some fields missing from database

**Check what's saved:**
```bash
node src/utils/inspectRCData.js RJ14UK0001
# Look for "Empty/Missing Fields" section
```

**Possible causes:**
1. API didn't return the field
2. Field name mismatch between API and database
3. JSONB storage issue

**Solution:**
1. Check Surepass API response in backend logs
2. Verify field names in `rcDataHandler.js`
3. Query database directly:
```sql
SELECT rc_data->>'vehicle_engine_number' FROM rc_cache WHERE rc_number = 'RJ14UK0001';
```

---

## 📝 Backend Files

| File | Purpose |
|------|---------|
| `rcVerificationController.js` | Main API endpoint for RC verification |
| `rcDataHandler.js` | Utility for normalizing and validating RC data |
| `inspectRCData.js` | CLI tool to inspect RC data in database |

---

## 🎨 Frontend Files

| File | Purpose |
|------|---------|
| `CreateLoan.tsx` | Loan creation form with RC fetch functionality |
| `rc-mapper.ts` | Maps RC fields to form fields |

---

## 🧪 Test Cases

### Test 1: Cache Hit
```
1. Fetch RC: RJ14UK0001
2. Check logs: "from_cache: true"
3. Fetch same RC again
4. Should be instant (from cache)
```

### Test 2: New Fetch
```
1. Use new RC number
2. Check logs: "from_cache: false"
3. Check database: RC should be saved
4. Fetch again: Should be from cache
```

### Test 3: Form Population
```
1. Fetch RC
2. Verify all fields populated:
   - engineNumber ✓
   - chassisNumber ✓
   - ownerName ✓
   - makerName ✓
   - makerModel ✓
   - fuelType ✓
   - manufacturingDate ✓
   - insuranceCompany ✓
   - insuranceValidUpto ✓
   - puccValidUpto ✓
   - financer ✓
   - financeStatus ✓
   - currentAddress ✓
   - currentDistrict ✓
   - currentState ✓
   - currentPincode ✓
```

---

## 📞 API Endpoints

### Verify RC
```
POST /rc-verification/verify
Content-Type: application/json

{
  "rc_number": "RJ14UK0001"
}

Response:
{
  "success": true,
  "from_cache": false,
  "source": "non-masked",
  "data": {
    "rc_details": { ... },
    "challan_info": { ... }
  }
}
```

---

## 🔗 Related Resources

- **Surepass API Docs**: https://docs.surepass.io/
- **PostgreSQL JSONB**: https://www.postgresql.org/docs/current/datatype-json.html
- **RC Data Flow Doc**: `src/RC_DATA_FLOW.md`

---

## 💡 Tips

1. **Always check cache first** - Saves API calls and money
2. **Log everything** - Makes debugging easier
3. **Validate data** - Use `validateRCData()` before saving
4. **Test with real RCs** - Different RCs may have different data
5. **Monitor database size** - RC cache can grow large over time

---

## 🚨 Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "RC number is required" | Empty rc_number | Validate input |
| "Failed to fetch RC details" | API error | Check Surepass token |
| "Both APIs failed" | Network issue | Check connectivity |
| "RC not found in cache" | First time fetch | Will call API |
| "Form fields empty" | Mapping issue | Check rc-mapper.ts |

---

## 📊 Performance

- **Cache Hit**: ~10ms
- **API Call**: ~500-2000ms
- **Database Save**: ~50ms
- **Form Population**: ~5ms

---

**Last Updated**: 2024
**Version**: 1.0
