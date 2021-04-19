const mysql = require('mysql');
const inquirer = require('inquirer');
const consoleTable = require("console.table");
const promisemysql = require("promise-mysql");
//Seperating connection properties to allow to call promise-mysql and mysql connections
const connectionProperties = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: //CHANGE WHEN YOU RUN ME//,
    database: 'employee_tracker_db',
};
const connection = mysql.createConnection(connectionProperties)
connection.connect((err) => {
    if (err) throw err;
    runPrompt();
});

const runPrompt = () => {
    inquirer
        .prompt({
            name: 'action',
            type: 'list',
            message: 'What would you like to do?',
            choices: [
                'View employees',
                'View employees by department',
                'View employees by manager',
                'Add departments',
                'Add role',
                'Add employee',
                'Update employee role',
                'Update employee manager',
                'Delete employee',
                'Delete role',
                'Delete department',
                'View department budgets',
                'EXIT'
            ],
        })
        .then((answer) => {
            switch (answer.action) {
                case 'View employees':
                    viewEmployees();
                    break;

                case 'View employees by department':
                    viewEmployeesByDepartment();
                    break;

                case 'View employees by manager':
                    viewEmployeesByManager();
                    break;

                case 'Add departments':
                    addDepartment();
                    break;

                case 'Add role':
                    addRole();
                    break;

                case 'Add employee':
                    addEmployee();
                    break;

                case 'Update employee role':
                    updateEmployeeRole();
                    break;

                case 'Update employee manager':
                    updateEmployeeManager();
                    break;

                case 'Delete employee':
                    deleteEmployee();
                    break;

                case 'Delete role':
                    deleteRole();
                    break;

                case 'Delete department':
                    deleteDepartment();
                    break;

                case 'View department budgets':
                    viewBudgets();
                    break;
                default:
                    console.log(`Invalid action: ${answer.action}`);
                    break;
            }
        });
};





const viewEmployees = async() => {
    const connection = await promisemysql.createConnection(connectionProperties);
    //SQL Workbench blueprint for query
    let sql = "SELECT first_name, last_name, title FROM employee INNER JOIN role ON employee.role_id = role.id";
    //On connection the query will run and the response will be posted to the console.table
    connection.query(sql, (err, res) => {
        if (err) throw err;
        console.log('GETTING EMPLOYEE INFORMATION');
        console.table(res);
        runPrompt();
        connection.end();
    })
   
};

const viewEmployeesByDepartment = async () => {
    let deptArr = [];
    try {
        const connection = await promisemysql.createConnection(connectionProperties);
        const deptName = await connection.query('SELECT name FROM department');
        for (i = 0; i < deptName.length; i++) {
            deptArr.push(deptName[i].name)
        };
        userAnswer = await inquirer.prompt({
            name: 'department',
            type: 'list',
            message: 'Which department do you wish to view?',
            choices: deptArr
        });
        const sql = `SELECT department.name AS department, role.salary, CONCAT(employee.first_name, ' ', employee.last_name) AS name FROM department LEFT JOIN role ON department.id = role.department_id  LEFT JOIN employee ON employee.role_id = role.id WHERE department.name = '${userAnswer.department}'`
        connection.query(sql, (err, res) => {
            if (err) throw err;
            console.log(`Getting information for employess in ${userAnswer.department}\n`);

            console.table(res);
            runPrompt();
            connection.end()
        })
    } catch (error) {
        console.error(error);
    }
};


const viewEmployeesByManager = async () => {
    let manArr = [];
    try {
        const connection = await promisemysql.createConnection(connectionProperties);
        const managerInfo = await connection.query("SELECT id , CONCAT(first_name,' ', last_name) AS name FROM employee WHERE manager_id IS NULL");

        manArr = [];
        for (i = 0; i < managerInfo.length; i++) {
            let objectQuery = {
                name: managerInfo[i].name,
                value: managerInfo[i].id
            }
            manArr.push(objectQuery);
            
        }
        const userAnswer = await inquirer.prompt({
            name: 'manager',
            type: 'list',
            message: 'Select which manager you would like to see the employess for.',
            choices: manArr

        });
        const sql = `SELECT role.title, CONCAT(first_name, ' ' , last_name) AS name FROM employee LEFT JOIN role ON role.id = employee.role_id WHERE manager_id = ${userAnswer.manager}`
        connection.query(sql, (err, res) => {
            if (err) throw err;
            console.log(`Getting employees for manager ${userAnswer.manager}\n`);

            console.table(res);
            runPrompt();
            connection.end();
        })
    } catch (error) {
        console.error(error);
    };
};

const addDepartment = async () => {
    try {
        userAnswer = await inquirer.prompt(
            {
                name: 'department',
                type: 'input',
                message: 'What is the name of the department you will like to add?'
            })

        const sql = `INSERT INTO department (name) VALUES ("${userAnswer.department}")`;
        connection.query(sql, (err, res) => {
            if (err) throw err;
            console.log(`\n ${userAnswer.department} added to departments \n`);
            runPrompt();
            connection.end()
        });

    } catch (error) {
        console.error(error)
    };
}
const addRole = async () => {
    let departmentArr = [];
    //find out what this does
    try {
        const connection = await promisemysql.createConnection(connectionProperties);
        const deptInfo = await connection.query(`SELECT id, name FROM department ORDER BY name ASC`);
        for (i = 0; i < deptInfo.length; i++) {
            departmentArr.push(deptInfo[i].name)
        }
        const userAnswer = await inquirer.prompt([{
            name: 'roleTitle',
            type: 'input',
            message: 'What is the name of the role you will like to add?'
        },
        {
            name: 'salary',
            type: 'input',
            message: 'What is the salary for this role?'
        },
        {
            name: 'departmentID',
            type: 'list',
            message: 'What department does this role belong to?',
            choices: departmentArr
        }
        ]);
        let deptID;
        for (i = 0; i < deptInfo.length; i++) {
            if (userAnswer.departmentID === deptInfo[i].name) {
                deptID = deptInfo[i].id
            }
        }
        const sql = `INSERT INTO role(title, salary, department_id)
            VALUES("${userAnswer.roleTitle}", ${userAnswer.salary},${deptID})`;

        connection.query(sql, (err, res) => {
            if (err) throw err;
            console.log(`\n Role ${userAnswer.roleTitle} has been added\n`);
            runPrompt()
        });
        connection.end()
    } catch (error) {
        console.error(error)
    }
};

const addEmployee = async () => {

    let roleArr = [];
    let managerArr = [];
    try {
        //Using promise-sql to create a connect with multiple connection calls
        const connection = await promisemysql.createConnection(connectionProperties);
        const roleInfo = await connection.query('SELECT id, title FROM role ORDER BY title ASC');
        const managerInfo = await connection.query("Select id, CONCAT( first_name, ' ', last_name) AS name FROM employee WHERE manager_id IS NULL");
        //putting the names of the rolls in an array to be called in the prompts later
        for (i = 0; i < roleInfo.length; i++) {
            roleArr.push(roleInfo[i].title);
        };
        //outing the manager names in an array to be called in the prompts later
        for (i = 0; i < managerInfo.length; i++) {
            managerArr.push(managerInfo[i].name)
        };
        userAnswer = await inquirer.prompt([{
            name: 'employeeFirst',
            type: 'input',
            message: 'What is the FIRST name of the employee you will like to add?',
            //checking if the user has placed an input
            validate: function (input) {
                if (input === '') {
                    console.log("INPUT IS REQUIRED");
                    return false;
                } else {
                    return true;
                }
            }
        },
        {
            name: 'employeeLast',
            type: 'input',
            message: 'What is the LAST name of the employee you will like to add?',
            validate: function (input) {
                if (input === '') {
                    console.log("INPUT IS REQUIRED");
                    return false;
                } else {
                    return true;
                }
            }
        },
        {
            name: 'role',
            type: 'list',
            message: 'What role is this employee',
            choices: roleArr

        },
        {
            name: 'manager',
            type: 'list',
            message: "Who is this employee's manager?",
            choices: managerArr
        }]);
        let managerID;
        let roleID;
        //setting the role to the id of that role
        for (i = 0; i < roleInfo.length; i++) {
            if (userAnswer.role == roleInfo[i].title) {
                roleID = roleInfo[i].id;
            }
        }
        //setting the manager to the id of that manager
        for (i = 0; i < managerInfo.length; i++) {
            if (userAnswer.manager == managerInfo[i].name) {
                managerID = managerInfo[i].id;
            }
        }
        //query to insert the new employee information into our database
        const sql = `INSERT INTO employee (first_name, last_name, role_id, manager_id)
    VALUES("${userAnswer.employeeFirst}", "${userAnswer.employeeLast}",${roleID}, ${managerID})`;

        await connection.query(sql, (err, res) => {
            if (err) throw err;
            //Confirm in console that the employee has been added
            console.log(`\n Employee ${userAnswer.employeeFirst} ${userAnswer.employeeLast} has been added\n`);
            runPrompt();
        });
        connection.end()
    } catch (error) {
        console.error(error)
    };
};

const updateEmployeeRole = async () => {
    let employeeArr = [];
    let roleArr = [];
    try {
        //Grabbing roleInfo and employeeInfo from SELECT queries
        const connection = await promisemysql.createConnection(connectionProperties);
        const roleInfo = await connection.query('SELECT id, title FROM role ORDER BY title ASC');
        const employeeInfo = await connection.query("SELECT id, CONCAT(first_name,' ',last_name) AS name FROM employee ORDER BY name ASC");
        //placeing roles in array
        for (i = 0; i < roleInfo.length; i++) {
            roleArr.push(roleInfo[i].title)
        }
        //place employees in array
        for (i = 0; i < employeeInfo.length; i++) {
            employeeArr.push(employeeInfo[i].name)
        }
        //Prompting the user to obtain answers
        const userAnswer = await inquirer.prompt([
            {
                name: 'employee',
                type: 'list',
                message: 'Which employee would you like to edit?',
                choices: employeeArr
            },
            {
                name: 'role',
                type: 'list',
                message: 'What is their new role?',
                choices: roleArr
            },
        ]);
        //creating variables to store role and employee ids
        let roleID;
        let employeeID;
        //setting roleID to the role_id chosen by the user
        for (i = 0; i < roleInfo.length; i++) {
            if (userAnswer.role == roleInfo[i].title) {
                roleID = roleInfo[i].id;
            }
        }
        //setting employeeID to the id of the employee the user chose
        for (i = 0; i < employeeInfo.length; i++) {
            if (userAnswer.employee == employeeInfo[i].name) {
                employeeID = employeeInfo[i].id
            }
        }
        //Query that updates out db in the employee column
        await connection.query(`UPDATE employee SET role_id = ${roleID} WHERE id = ${employeeID}`, (err, res) => {
            if (err) throw err;
            console.log(`\n ${userAnswer.employee} role has been updated to ${userAnswer.role} \n`);
            runPrompt();
        })
        connection.end()
    } catch (err) {
        console.error(err)
    }

};

const updateEmployeeManager = async () => {
    let employeeArr = [];
    try {
        const connection = await promisemysql.createConnection(connectionProperties);
        employeeInfo = await connection.query("SELECT id, CONCAT (first_name, ' ' , last_name) AS name FROM employee ORDER by name ASC");
        for (i = 0; i < employeeInfo.length; i++) {
            employeeArr.push(employeeInfo[i].name);
        };
        userAnswer = await inquirer.prompt([
            {
                name: 'employee',
                type: 'list',
                message: 'Choose an employee to edit',
                choices: employeeArr
            },
            {
                name: 'manager',
                type: 'list',
                message: ' Who is their manager?',
                choices: employeeArr
            },
        ])
        let employeeID;
        let managerID;
        //getting id of answer.manager
        for (i = 0; i < employeeInfo.length; i++) {
            if (userAnswer.manager == employeeInfo[i].name) {
                managerID = employeeInfo[i].id;
            }
        }
        //getting id for userAnswer.employee
        for (i = 0; i < employeeInfo.length; i++) {
            if (userAnswer.employee == employeeInfo[i].name) {
                employeeID = employeeInfo[i].id;
            }
        }
        connection.query(`UPDATE employee SET manager_id = ${managerID} WHERE id = ${employeeID}`, (err, res) => {
            if (err) throw err;
            console.log(`\n ${userAnswer.employee} is know managed by  ${userAnswer.manager}\n`)
            runPrompt();
            connection.end()
        });
    } catch (err) {
        console.error(err)
    };
};

const deleteEmployee = async () => {
    let employeeArr = [];
    try {
        const connection = await promisemysql.createConnection(connectionProperties);
        const employeeInfo = await connection.query("SELECT id, CONCAT(first_name, ' ', last_name) AS name FROM employee ORDER BY name ASC");
        for (i = 0; i < employeeInfo.length; i++) {
            employeeArr.push(employeeInfo[i].name);
        };
        const userAnswer = await inquirer.prompt([
            {
                name: 'employee',
                type: 'list',
                message: 'Who would you like to delete',
                choices: employeeArr
            },
            {
                name: 'yesOrNo',
                type: 'list',
                message: 'Confirm delete',
                choices: ["YES", "NO"]
            }
        ])
        if (userAnswer.yesOrNo == "YES") {
            let employeeID;
            for (i = 0; i < employeeInfo.length; i++) {
                if (userAnswer.employee == employeeInfo[i].name) {
                    employeeID = employeeInfo[i].id;
                }
            }
            connection.query(`DELETE FROM employee WHERE id = ${employeeID};`, (err, res) => {
                if (err) throw err;
                console.log(`\n ${userAnswer.employee} has been deleted\n`);
                runPrompt()
                connection.end()
            });
        } else {
            console.log(`\n ${userAnswer.employee} not deleteed\n`);
            runPrompt();
            connection.end()
        }
    } catch (err) {
        console.error(err)
    };
};

const deleteRole = async () => {
    let roleArr = [];

    try {
        const connection = await promisemysql.createConnection(connectionProperties);
        const roleInfo = await connection.query("SELECT id, title FROM role");
        for (i = 0; i < roleInfo.length; i++) {
            roleArr.push(roleInfo[i].title)

        };
        const userAnswer = await inquirer.prompt([
            {
                name: 'role',
                type: 'list',
                message: 'Select a role to delete',
                choices: roleArr
            },
            {
                name: 'yesOrNo',
                type: 'list',
                message: 'WARNING deleting a role will delete all employess within the role. Do you wish to continue?',
                choices: ['YES', 'NO']
            }
        ]);

        if (userAnswer.yesOrNo === "YES") {
            let roleID;

            
            for (let i = 0; i < roleInfo.length; i++) {
                if (userAnswer.role == roleInfo[i].title) {
                    roleID = roleInfo[i].id
                }
            }
            console.log(roleID + 'PING')
            connection.query(`DELETE FROM role WHERE id = ${roleID}`, (err, res) => {
                if (err) throw err;
                console.log(`\n ${userAnswer.role} has been deleted\n`);
                runPrompt();
                connection.end()
            });
        } else {
            console.log("\n Nothing was deleted\n")
            runPrompt();
        }
    } catch (err) {
        console.error(err)
    };
};

const deleteDepartment = async () => {
    let deptArr = [];
try{
    const connection = await promisemysql.createConnection(connectionProperties);
    deptInfo = await connection.query("SELECT id, name FROM department");
    for (i = 0; i < deptInfo.length; i++) {
        deptArr.push(deptInfo[i].name);
    };
    userAnswer = await inquirer.prompt([
        {
            name: 'department',
            type: 'list',
            message: 'Select a department to delete',
            choices: deptArr
        },
        {
            name: 'yesOrNo',
            type: 'list',
            message: 'WARNING deleting a department will delete all employess within the role. Do you wish to continue?',
            choices: ['YES', 'NO']
        }
    ]);
    if (userAnswer.yesOrNo === "YES") {
        let deptID;
        for (i = 0; i < deptInfo.length; i++) {
            if (userAnswer.department == deptInfo[i].name) {
                deptID = deptInfo[i].id
            }
        }
        connection.query(`DELETE FROM department WHERE id = ${deptID}`, (err, res) => {
            if (err) throw err;
            console.log(`\n ${userAnswer.department} has been deleted`);
            runPrompt();
            connection.end()
        })
        } else {
        console.log("\n Nothing was deleted\n")
        runPrompt();
        }
    } catch (err) {
        console.error(err)
    };
};

const viewBudgets = async () => {
    const connection = await promisemysql.createConnection(connectionProperties);
    const salary = await connection.query('SELECT name, role.salary FROM department LEFT JOIN role ON role.department_id = department.id');
    const dept = await connection.query("SELECT name FROM department");
    let deptBudgetArr = [];
    let deptName;
            for (i = 0; i < dept.length; i++) {
            let departmentBudget = 0;

            for (x = 0; x < salary.length; x++) {
                if (dept[i].name == salary[x].name) {
                    departmentBudget += salary[x].salary;
                }
            }
            deptName = {
                Department: dept[i].name,
                Budget: departmentBudget
            }
            deptBudgetArr.push(deptName)
        }
        console.log('\n');
        console.table(deptBudgetArr);
        runPrompt();
    };
 
