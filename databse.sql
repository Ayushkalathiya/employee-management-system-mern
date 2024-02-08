create table Department(
	Dept_No serial,
	Dept_Name text Primary Key,
	Employees int
);
create table employee(
    Emp_id text primary key,
    F_name text,
    L_name text,
	Dept_name text,
    Email text,
    Mo_No text,
    Country text,
    State text,
    City text,
    DOB DATE,
    DOJ DATE,
    Address text,
	FOREIGN KEY(Dept_name)
	references Department(Dept_name)
);

create table Credential(
    empId text Primary Key,
    role text,
    password text
);