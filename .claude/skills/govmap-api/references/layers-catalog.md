# GovMap Layers Catalog — Complete Reference

All 122 government map layers available on govmap.gov.il with their layer IDs, Hebrew names, data sources, and field schemas. Field schemas shown for layers that returned metadata via `GET /api/layers-catalog/layer/{layerId}/metadata` (tested 2026-04-10).

## Layer Categories

### Emergency Services & Safety

#### `Emergancy_Hospitals` — בתי חולים
- **Source:** משרד הבריאות
- **Tested:** 3 entities within 5km of Tel Aviv
- **Key fields:** `institut_2` (בית חולים), `institut_1` (שם), `institut_5` (מאפיין), `h_owner_na` (סוג), `settleme_1` (ישוב), `address` (כתובת), `tel_no` (טלפון), `fax_no` (פקס), `zip_code` (מיקוד), `tot_beds` (tot_beds)

#### `POLICE_Yehida_Location` — תחנות ונקודות משטרה
- **Source:** משטרת ישראל
- **Tested:** 9 entities within 5km of Tel Aviv
- **Key fields:** `unitname` (שם), `sitetype` (סוג אתר), `address` (כתובת), `mahozname` (מחוז), `merhavname` (מרחב), `notes` (הערות), `x_itm`, `y_itm`

#### `FIRE_STATIONS` — תחנות כיבוי אש
- **Source:** נציבות כבאות והצלה
- **Tested:** 6 entities within 5km of Tel Aviv
- **Key fields:** `staname` (שם התחנה), `primary_su` (סוג תחנה), `address` (כתובת), `mahoznam` (שם מחוז), `fire_area` (שם אזור), `street`, `h_num`, `place`

#### `MADA_STATIONS` — תחנות מגן דוד אדום
- **Source:** מגן דוד אדום
- **Tested:** 0 entities within 5km of Tel Aviv (may need larger radius)
- **Key fields:** `station` (תחנה), `region` (מחוז), `censor`

#### `activefaults` — שברים פעילים
- **Metadata:** null (not queryable or different ID needed)

---

### Land & Property

#### `PARCEL_ALL` — חלקות
- **Source:** המרכז למיפוי ישראל
- **Tested:** 100 entities (capped) within 2km of Tel Aviv
- **Disclaimer:** "המידע המוצג הינו מהימן אך לעיתים אינו מעודכן / טעות סופר. אין לעשות בו כל שימוש רשמי"
- **Key fields:** `gush_num` (מספר גוש), `parcel` (חלקה), `gush_suffix` (תת גוש), `legal_area` (שטח רשום מ"ר), `status_text` (סטטוס), `note` (הערה), `locality_name`, `county_name`, `region_name`

#### `SUB_GUSH_ALL` — גושים
- **Source:** המרכז למיפוי ישראל
- **Tested:** 100 entities (capped) within 5km
- **Key fields:** `gush_num` (מספר גוש), `gush_suffix` (תת גוש), `status_text` (סטטוס), `locality_name`, `county_name`, `region_name`, `shape_area`

---

### Demographics & Geography

#### `Neighborhood` — שכונות
- **Source:** הלשכה המרכזית לסטטיסטיקה
- **Tested:** 4 entities within 2km of Tel Aviv
- **Key fields:** `fname` (שם שכונה/אזור), `setl_name` (שם ישוב), `fname_ltn` (Latin name), `nbr_code`, `setl_code`

#### `statistic_areas` — אזורים סטטיסטיים 2008
- **Source:** הלשכה המרכזית לסטטיסטיקה
- **Description:** שכבה ארצית של גבולות אזורים סטטיסטיים ותחומי שיפוט הכוללת נתונים דמוגרפיים בסיסיים, מעודכנת לשנת 2008
- **Tested:** 100 entities (capped) within 5km
- **Key fields:** `shem_yishuv` (ישוב), `stat08` (אזור סטטיסטי 2008), `pop_total` (אוכלוסיה באלפים), `male_total` (גברים באלפים), `female_total` (נשים באלפים), `age_0_14`, `age_15_19`, `age_20_29`, `age_30_64`, `age_65_up` (demographics by age), `districtheb` (מחוז), `subdistrictheb` (נפה), `natregheb` (אזור טבעי), `metrheb` (מטרופולין), `muniheb` (מעמד מוניציפלי), `typelocheb` (צורת ישוב), `religion_yishuv_txt` (דת עיקרית), `main_function_txt` (תפקוד עיקרי), `estbyr` (שנת יסוד)

#### `yeshuvim` — אזורים מוניציפליים
- **Metadata:** Not tested

#### `MUNICIPALY` — מועצות אזוריות
- **Metadata:** Not tested

#### `REGION` — מחוזות משרד הפנים
- **Metadata:** Not tested

#### `COUNTY` — נפות משרד הפנים
- **Metadata:** Not tested

---

### Transportation

#### `bus_stops` — תחנות אוטובוס
- **Source:** משרד התחבורה
- **Tested:** 100 entities (capped) within 5km of Tel Aviv
- **Key fields:** `stop_name` (STOP_NAME), `stop_desc` (STOP_DESC), `stop_code` (STOP_CODE), `x` (X), `y` (Y), `zone_id`

#### `GASSTATIONS` — תחנות דלק
- **Source:** (not specified in metadata)
- **Tested:** 55 entities within 5km of Tel Aviv
- **Key fields:** `value3`/`name` (שם), `value1`/`company` (חברה), `value2`/`address` (כתובת), `value4`/`city` (עיר), `value5`/`region` (אזור)

#### `trans_poi` — מתקני רישוי נהיגה
- **Metadata:** Not tested

---

### Tourism & Recreation

#### `hotels` — בתי מלון
- **Source:** משרד התיירות
- **Tested:** 93 entities within 5km of Tel Aviv
- **Key fields:** `שם_המ` (שם), `סוג_ה` (סוג לינה), `addr` (כתובת), `יישוב` (יישוב), `room_num` (מספר חדרים)

#### `zimmer` — צימרים
- **Source:** משרד התיירות
- **Tested:** Not tested (unlikely near Tel Aviv)
- **Key fields:** `name` (שם), `address` (כתובת), `city` (עיר), `region` (אזור), `phone` (טלפון), `email` (דוא"ל), `url` (קישור), `rate` (דרוג), `kosher` (כשרות), `wifi` (WiFi), `parking` (חניה), `accessibility` (נגישות לנכים), `number_of_units` (מספר יחידות), `accommodation_type` (סוג לינה), `near_to` (ליד), `shortdescription` (תאור)

#### `atractions` — אטרקציות
- **Source:** משרד התיירות
- **Tested:** Not tested
- **Key fields:** `name` (שם), `attraction_type` (סוג אטרקציה), `address` (כתובת), `city` (עיר), `region` (אזור), `phone` (טלפון), `url` (קישור), `opening_hours` (שעות פתיחה), `parking` (חניה), `accessibility` (נגישות), `suitable_for_children` (מתאים לילדים), `blue_flag` (דגל כחול), `scheduled_visits` (תאום ביקור)

#### `winery` — יקבים
- **Source:** משרד התיירות
- **Key fields:** `name` (שם), `address` (כתובת), `phone` (טלפון), `link` (קישור), `fax` (פקס)

#### `tayarut` — אתרי תיירות בתכנון
- **Metadata:** Not tested

#### `atikot_sites_itm` — אתרי עתיקות
- **Source:** רשות העתיקות
- **Key fields:** `ata_shem` (שם אתר), `atar_number` (מספר אתר), `mehoz_name` (שם מחוז), `atar_heb_desc` (תאור אתר בעברית), `atar_eng_desc` (תאור אתר באנגלית)

#### `sport` — מתקני ספורט
- **Source:** משרד התרבות והספורט
- **Key fields:** `new_name` (שם מתקן), `new_id_facility_type` (סוג המתקן), `new_id_local_authority` (רשות מקומית), `new_s_street` (רחוב), `new_s_region` (מחוז), `new_b_indoor` (מקורה), `new_b_lighting` (תאורה), `new_b_parking` (חניה), `new_n_seats_num` (מספר מושבים), `new_l_surface_type` (סוג משטח), `new_b_disabled_access` (נגישות לנכים), `new_id_year_found` (שנת הקמה)

---

### Nature & Environment

#### `shmurot_teva_ganim` — שמורות טבע
- **Metadata:** null
- **Tested:** 0 entities near Tel Aviv (expected — urban area)

#### `ganim_leumim` — גנים לאומיים
- **Metadata:** null
- **Tested:** 0 entities near Tel Aviv (expected — urban area)

#### `ilforest` — יער נטע אדם
- **Metadata:** Not tested

#### `Quarries` — מחצבות
- **Metadata:** Not tested

#### `Soil_types` — חבורות קרקע
- **Metadata:** Not tested

---

### Health & Social Services

#### `Health_care_baby_stations` — תחנות טיפת חלב
- **Metadata:** null

#### `MOSDOT_griatric` — מוסדות גריאטריים
- **Source:** משרד הבריאות
- **Key fields:** `full_heb_n` (שם מוסד), `street` (רחוב), `house_no` (מספר בית), `city` (ישוב), `tel1` (טלפון), `zip` (מיקוד), `taagid_nam` (שם תאגיד)

#### `Chambers` — לשכות משרד הבריאות
- **Metadata:** Not tested

---

### Financial Services

#### `banks` — סניפי בנקים
- **Source:** בנק ישראל
- **Key fields:** `bank_name` (שם בנק), `bank_code` (קוד בנק), `branch_nam` (כינוי/תיאור יחידה), `branch_cod` (מספר סניף), `branch_add` (כתובת), `city` (יישוב), `telephone` (טלפון), `fax` (פקס), `zip_code` (מיקוד), `branch_typ` (סוג סניף), `day_closed` (יום סגור), `handicap_a` (נגישות)

---

### Infrastructure & Utilities

#### `cell_active` — אנטנות סלולריות פעילות
- **Source:** (from description link to gov.il)
- **Updated:** 10/30/2025
- **Key fields:** `site_num` (מספר אתר), `company` (חברה), `type` (סוג אתר), `address` (כתובת האתר), `city` (יישוב), `local_auth` (רשות מקומית), `technology` (טכנולוגיית שידור), `permit` (היתר קרינה), `intensity` (עוצמת קרינה), `percent` (% ביחס לסף הבריאות), `hafala_dat` (תאריך הפעלה)

#### `elect_regions` — נפות חברת חשמל
- **Metadata:** Not tested

#### `contour` — קווי גובה
- **Metadata:** Not tested

---

### Census 2008 Layers

These layers contain demographic data from the 2008 census, available as separate layer IDs:

| Layer ID | Hebrew Name |
|---|---|
| `Sex_Age_Religion` | אוכלוסייה - מפקד 2008 |
| `Civil_Labour_Force` | בכוח העבודה האזרחי |
| `Ages65_Plus` | בני 65 ומעלה |
| `Disabilities` | בעלי מוגבלויות |
| `Housing` | דיור |
| `Education` | השכלה |
| `Origin` | מוצא |
| `Durable_Goods` | מוצרים בני קיימא |
| `Employee_Jobs` | מעמד בעבודה |
| `Marrige_Birth` | נישואין וילודה |
| `Occupations` | משלחי יד |
| `Households` | משקי בית |
| `Industries` | ענפי תעסוקה |
| `WorkingHours_Transport` | שעות עבודה ותחבורה |

---

### Government Districts & Boundaries

| Layer ID | Hebrew Name | Source |
|---|---|---|
| `POLICE_Mahoz_Region` | מחוזות משטרה | משטרת ישראל |
| `POLICE_Merhav_Region` | מרחבים של משטרה | משטרת ישראל |
| `health_districts` | מחוזות משרד הבריאות | |
| `agriculture_districts` | מחוזות משרד החקלאות | |
| `MMI_districts` | מחוזות מנהל מקרקעי ישראל | |
| `moch_districts` | מחוזות משרד הבינוי והשיכון | |
| `Mada_districs` | מחוזות מגן דוד אדום | |
| `Administration_Areas_new` | מחוזות המשרד להגנת הסביבה | |
| `NEMA` | מחוזות רשות חירום לאומית | |
| `fire_admin` | רשויות כבאות והצלה | |
| `drainage_authorities` | רשויות ניקוז | |

---

### Urban Planning

#### `mitchmim_mshbsh` — התחדשות עירונית
- **Metadata:** null (layer ID may have changed)

#### `retzefMigrashim` — מגרשי תב"ע (ממ"י)
- **Metadata:** Not tested

#### `migrashim_msbs` — מגרשים (משרד הבינוי והשיכון)
- **Metadata:** Not tested

---

### Other Layers

| Layer ID | Hebrew Name |
|---|---|
| `milestones` | אבני ק"מ |
| `ilezor` | אזורי קק"ל |
| `f_natural` | אזורים טבעיים |
| `scenery_units` | חטיבות נוף |
| `ilPublicSites_June05` | חניונים ואתרים של קק"ל |
| `d170308_teva` | טבע עירוני |
| `Mean_Temperature_Anual` | טמפרטורה שנתית ממוצעת |
| `Moatzot` | מועצות דתיות |
| `Mikve` | מקוואות |
| `btl` | סניפי ביטוח לאומי (חלקי) |
| `Soil_survey` | סקר קרקעות |
| `suburb_rehabilitation` | שיקום שכונות |
| `Gazetteer` | שמות גאוגרפיים |
| `GPS_stations` | תחנות GPS |
| `PetroleumRights` | זכויות נפט |
| `OilGasWells` | קידוחי נפט וגז |
| `HOF_NAKI_update` | הניקיון בחוף |
| `esip_0304` | רגישות חופי הים לזיהומי שמן |
| `open_area_sens` | רגישות שטחים פתוחים |
| `density1967` | צפיפות אוכלוסייה 1967 |
| `t413` | מפת תקן בניה לרעידות אדמה |
| `beit_shean_7_5` | תרחיש רעידת אדמה במוקד בית שאן |
| `fire_areas` | שטחי אימונים |
| `Michrazim` | מכרזי מנהל מקרקעי ישראל |
| `Michrazim_Haluka` | מכרזי ממ"י מגרשים |
| `atudot_mmi` | עתודות קרקע (ממ"י) |
| `d180308_meida` | מידע ירוק |
| `d180308_tarbut` | תרבות אורבאנית |
| `LOCALITY_VAAD0410` | גבולות וועדי ישובים |
| `LOCALITY_210410` | גבולות ישובים |
| `LOCALITY` | ישובים |

---

## Layers with Null Metadata

The following layers returned `null` from the metadata endpoint. They may:
- Use different layer IDs than listed in Appendix A
- Require authentication to access metadata
- Be deprecated or renamed

| Layer ID | Hebrew Name |
|---|---|
| `shmurot_teva_ganim` | שמורות טבע |
| `ganim_leumim` | גנים לאומיים |
| `mitchmim_mshbsh` | התחדשות עירונית |
| `activefaults` | שברים פעילים |
| `Health_care_baby_stations` | תחנות טיפת חלב |

To discover the correct IDs, try querying the layers-catalog for a broader catalog listing, or browse govmap.gov.il and inspect network requests.
