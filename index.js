
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const csv = require('csv-parser');

const db = new sqlite3.Database('database.sqlite');

function loadCsvData(db, csvFilePath, tableName) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(csvFilePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                if (results.length === 0) {
                    resolve();
                    return;
                }

                const columns = Object.keys(results[0]);
                const placeholders = columns.map(() => '?').join(',');
                const query = `INSERT OR IGNORE INTO ${tableName} (${columns.map(c => `"${c}"`).join(',')}) VALUES (${placeholders})`;

                db.serialize(() => {
                    const stmt = db.prepare(query);
                    results.forEach(row => {
                        const values = columns.map(col => row[col]);
                        stmt.run(values);
                    });
                    stmt.finalize((err) => {
                        if (err) {
                            reject(err);
                        } else {
                            console.log(`Data from ${csvFilePath} loaded into ${tableName}`);
                            resolve();
                        }
                    });
                });
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

async function main() {
    db.serialize(async () => {
        try {
            // Drop existing tables to ensure a clean slate
            db.run('DROP TABLE IF EXISTS Patients');
            db.run('DROP TABLE IF EXISTS Foods');
            db.run('DROP TABLE IF EXISTS Recipes');
            db.run('DROP TABLE IF EXISTS DietCharts');
            db.run('DROP TABLE IF EXISTS DietChartMeals');

            // Create tables
            const createPatientsTableQuery = `
                CREATE TABLE Patients (
                    "PatientID" VARCHAR(255) PRIMARY KEY,
                    "Name_Pseudonym" VARCHAR(255),
                    "Age" INT,
                    "Gender" VARCHAR(50),
                    "Contact_Info" TEXT,
                    "Dietary_Habits" VARCHAR(255),
                    "Meal_Frequency_per_day" VARCHAR(255),
                    "Bowel_Movements" VARCHAR(255),
                    "Water_Intake_Liters" VARCHAR(255),
                    "Physical_Activity_Level" VARCHAR(255),
                    "Sleep_Patterns" VARCHAR(255),
                    "Stress_Levels" VARCHAR(255),
                    "Allergies" TEXT,
                    "Comorbidities" TEXT,
                    "Dosha_Prakriti_Assessment" VARCHAR(255)
                )
            `;
            db.run(createPatientsTableQuery);
            console.log('Patients table created');

            const createFoodsTableQuery = `
                CREATE TABLE Foods (
                    "FoodID" VARCHAR(255) PRIMARY KEY,
                    "Food_Name_English" VARCHAR(255),
                    "Food_Name_Local" VARCHAR(255),
                    "Base_Item" VARCHAR(255),
                    "Category" VARCHAR(255),
                    "Cuisine" VARCHAR(255),
                    "Scientific_Name" VARCHAR(255),
                    "Description" TEXT,
                    "Meal_Type" VARCHAR(255),
                    "Serving_Size_g" VARCHAR(255),
                    "Rasa" VARCHAR(255),
                    "Virya" VARCHAR(255),
                    "Vipaka" VARCHAR(255),
                    "Guna" VARCHAR(255),
                    "Digestibility" VARCHAR(255),
                    "Dosha_Suitability" VARCHAR(255),
                    "Allergen_Warnings" TEXT
                )
            `;
            db.run(createFoodsTableQuery);
            console.log('Foods table created');

            const createRecipesTableQuery = `
                CREATE TABLE Recipes (
                    "RecipeID" VARCHAR(255) PRIMARY KEY,
                    "Recipe_Name" VARCHAR(255) NOT NULL,
                    "Ingredients" TEXT,
                    "Cooking_Method" VARCHAR(255),
                    "Total_Calories_per_Serving" REAL,
                    "Total_Protein_g" REAL,
                    "Total_Fat_g" REAL,
                    "Total_Carbs_g" REAL,
                    "Total_Fiber_g" REAL,
                    "Total_Vit_A_IU" REAL,
                    "Total_Vit_C_mg" REAL,
                    "Total_Vit_D_ug" REAL,
                    "Total_Vit_E_mg" REAL,
                    "Total_Iron_mg" REAL,
                    "Total_Calcium_mg" REAL,
                    "Total_Potassium_mg" REAL,
                    "Dosha_Suitability" VARCHAR(255),
                    "Linked_FoodIDs" TEXT
                )
            `;
            db.run(createRecipesTableQuery);
            console.log('Recipes table created');

            const createDietChartsTableQuery = `
                CREATE TABLE DietCharts (
                    "ChartID" VARCHAR(255) PRIMARY KEY,
                    "PatientID" VARCHAR(255),
                    "Date" DATETIME,
                    "Total_Calories" REAL,
                    "Total_Protein_g" REAL,
                    "Total_Fat_g" REAL,
                    "Total_Carbs_g" REAL,
                    "Total_Fiber_g" REAL,
                    "Clinical_Notes" TEXT,
                    FOREIGN KEY (PatientID) REFERENCES Patients(PatientID)
                )
            `;
            db.run(createDietChartsTableQuery);
            console.log('DietCharts table created');

            const createDietChartMealsTableQuery = `
                CREATE TABLE DietChartMeals (
                    "ChartID" VARCHAR(255),
                    "PatientID" VARCHAR(255),
                    "Date" DATETIME,
                    "Meal_Time" VARCHAR(255),
                    "Item_Type" VARCHAR(255),
                    "Item_ID" VARCHAR(255),
                    "Portion_g_or_serving" VARCHAR(255),
                    "Calories" REAL,
                    "Protein_g" REAL,
                    "Fat_g" REAL,
                    "Carbs_g" REAL,
                    "Fiber_g" REAL,
                    "Ayurveda_Notes" TEXT,
                    FOREIGN KEY (ChartID) REFERENCES DietCharts(ChartID),
                    FOREIGN KEY (PatientID) REFERENCES Patients(PatientID)
                )
            `;
            db.run(createDietChartMealsTableQuery);
            console.log('DietChartMeals table created');

            // Load data from CSVs
            await loadCsvData(db, 'Patient_Profile_1000.csv', 'Patients');
            await loadCsvData(db, 'Food_Database_10000.csv', 'Foods');
            await loadCsvData(db, 'Recipe_Database_600.csv', 'Recipes');
            await loadCsvData(db, 'Diet_Charts_Summary_2000.csv', 'DietCharts');
            await loadCsvData(db, 'Diet_Charts_Meals_8000rows.csv', 'DietChartMeals');

        } catch (err) {
            console.error('An error occurred:', err);
        } finally {
            db.close((err) => {
                if (err) {
                    console.error(err.message);
                }
                console.log('Closed the database connection.');
            });
        }
    });
}

main().catch(console.error);
