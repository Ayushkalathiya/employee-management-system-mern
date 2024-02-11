Create table Departments(
	DeptID int Primary Key GENERATED BY DEFAULT AS IDENTITY 
    (START WITH 100 INCREMENT BY 1),
	DeptName text,
	Location text
);

Create table Roles(
	RoleID int Primary Key GENERATED BY DEFAULT AS IDENTITY 
    (START WITH 200 INCREMENT BY 1),
	RoleName text NOT NULL UNIQUE,
	Description text
);

Create table Permissions(
	PermissionID int Primary Key GENERATED BY DEFAULT AS IDENTITY 
    (START WITH 300 INCREMENT BY 1),
	PermissionName text,
	Description text
);

create table Role_Permissions(
	RoleID int,
	PermissionID int,
	FOREIGN KEY(RoleID) references Roles(RoleID),
	Foreign Key(PermissionID) References Permissions(PermissionID)
);

Create table Employees(
	EmployeeID text Primary Key,
	FirstName text,
	LastName text,
	DOB date,
	Gender text,
	Email text,
	Phone text,
	Address text,
	RoleID int,
	DeptID int,
	DOJ date,
	Position text,
	Salary int,
	Foreign Key(RoleID) References Roles(RoleID),
	Foreign Key(DeptID) References Departments(DeptID)
);

Create table Credentials(
	EmployeeID text Unique NOT NULL,
	Password text,
	Foreign Key(EmployeeID) References Employees(EmployeeID)
);

create table LeaveRequests(
	LeaveRequestID int Primary Key GENERATED BY DEFAULT AS IDENTITY 
    (START WITH 1000 INCREMENT BY 1),
	EmployeeID text,
	LeaveType text,
	StartDate date,
	EndDate date,
	Status text,
	Description text,
	Foreign Key(EmployeeID) References Employees(EmployeeID)
);

create table ResetPass(
	EmployeeID text,
	ResetToken text,
	Expiration timestamp,
	-- Pachi View Table Ma jaine with time Zone KRi dejo Expiration Column ni properties ma jaine 
	Foreign Key(EmployeeID) References Employees(EmployeeID)
);
