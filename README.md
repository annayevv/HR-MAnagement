<<<<<<< HEAD
# HR-Management
=======
# Document Management System

This project allows users to manage documents. Users can log into the system, add new documents, view a list of registered employees, and see their status. This is a small system built using React and Tailwind CSS, with 'axios' used to fetch data from an API.

## Functional Capabilities

- **Login (Authentication):** User authentication allows users to log in with a username and password, and send API requests based on tokens (access and refresh).
- **Token Refresh:** Automatically refreshes access tokens every 15 minutes.
- **Add Document** Users can add documents to the list.
- **Token Tracking:** Uses an "access" token that automatically refreshes every 15 minutes.
- **Expired Documents:** Expired documents are displayed in a separate tab..

## Technologie

- **React** - Used for building UI components
- **React Router** - For navigation between pages.
- **Axios** - For handling API requests.
- **Tailwind CSS** - For styling UI components.

## File Structure

- **App.js** - The main project file, which manages user status and tokens, as well as page navigation
- **Login.js** - The user login page.
- **DocumentForm.js** - The form component for adding new documents.
- **EmployeesList.js** - The component that displays the list of employees.


# TimeSheet Application

This project is a React-based TimeSheet management application that helps manage employee work hours and attendance. It provides functionalities for viewing, editing, and tracking timesheet data for employees across different days of the month. The design is styled using Tailwind CSS, making it visually appealing and responsive.

## Features

### Core Functionalities:
- **Employee Attendance Management:**
  - View employee attendance data by month.
  - Add, update, or delete worked hours for specific days.
  - Mark days with different types such as `Worked`, `Not Worked`, `Sick`, and `Holiday` using intuitive icons.

- **Dynamic Month Navigation:**
  - Navigate through months to view or manage past or future attendance records.

- **Responsive Design:**
  - The UI is optimized for various screen sizes, ensuring accessibility on desktops, tablets, and mobile devices.

- **Statistics Integration:**
  - A button to navigate to a separate page showing employee statistics.

- **Scrollable Table:**
  - Horizontally scrollable table for viewing multiple days in a month with smooth navigation buttons.

### Technologies Used:
- **React:** Framework for building the user interface.
- **Tailwind CSS:** For styling the components.
- **React Icons:** Used for intuitive and consistent icons.
- **Custom API:** Functions to interact with the backend, such as `fetchTimesheetData`, `fetchEmployees`, `fetchDayTypes`, `submitWorkedHours`, and `deleteTimesheetEntry`.

### File Structure:
- **TimeSheet.js:**
  - The main component that renders the timesheet table and manages the data.
  - Includes event handlers for adding, updating, and deleting timesheet entries.

### API Integrations:
- **Fetching Data:**
  - Employee details, attendance records, and day types are fetched from an external API.
- **Submitting Data:**
  - Worked hours and day types are submitted to the API for real-time updates.
- **Deleting Entries:**
  - Allows deleting specific timesheet entries via API calls.


  ## Usage

1. Launch the application in your browser by navigating to `http://localhost:3000`.
2. Add new documents by clicking on the "Add Document" button.
3. Track the status of your documents in the "Status" section.
4. View documents sorted by their deadlines in the "Deadlines" section.
5. Switch the application language from the settings menu. Supported languages are:
   - **English**
   - **Turkmen**

## Customization

You can modify the system's behavior and appearance according to your needs. To enable additional languages or features, edit the configuration files in the `/config` directory. Ensure translations are added to the respective language files.


## Setup Instructions

1. Clone the repository:

   ```bash
   git clone https://github.com/orazannayev/My_code.git
   cd TM_CARS
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the development server:

   ```bash
   npm start
   ```

   The application will be available at `http://localhost:3000`.

4. Build the application for production:

   ```bash
   npm run build
   ```

## Deployment Guide

### Using Nginx:

1. **Build the Application:**
   
   ```bash
   npm run build
   ```
   
   This will generate a `dist` directory containing optimized static files.

2. **Upload to Server:**

   Transfer the `dist` directory to your server:

   ```bash
   scp -r dist/ user@your-server:/var/www/html/timesheet-app
   ```

3. **Configure Nginx:**

   Update your Nginx configuration to serve the React app:

   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       root /var/www/html/timesheet-app;
       index index.html;

       location / {
           try_files $uri /index.html;
       }
   }
   ```

   Replace `yourdomain.com` with your actual domain.

4. **Restart Nginx:**

   ```bash
   sudo systemctl restart nginx
   ```

5. **Access the Application:**

   Open `http://yourdomain.com` in a browser to view the deployed application.

## Summary

This TimeSheet application simplifies the process of managing employee attendance and work hours. Its user-friendly interface and robust functionality make it a valuable tool for businesses of all sizes.

Enjoy managing your TimeSheet efficiently! 🚀


## Setup and Installation

- **Node.js** - Required to run the project.
- **NPM or Yarn** - To install dependencies.

### Taslamany Klonlamak

1. Clone the project from GitLab:

   ```bash
   git clone https://github.com/orazannayev/My_code.git
   cd  TM_CARS
   ```

   then :

   ```bash
   npm start

   ```

   # Deployment Guide for React Application with Nginx

## Prerequisites

To deploy this React application using Nginx, ensure you have the following:

1. A server with **Nginx** installed.
2. Access to upload files to the server.
3. Basic knowledge of server commands.

---

## Steps to Deploy

### 1. Build the React Application

First, create a production build of your React application. Run the following command:

```bash
npm run build
```

This will generate a `dist` directory containing optimized static files ready for deployment.

---

### 2. Upload the Build Files to the Server

Transfer the `dist` directory to your server using `scp` or any file transfer method. Replace `user`, `your-server`, and target path as appropriate.

```bash
scp -r dist/ user@your-server:/var/www/html/inventory-management
```

Here:

- `dist/` is the directory created from the build.
- `/var/www/html/inventory-management` is the destination path on the server.

---

### 3. Configure Nginx

Open the Nginx configuration file (e.g., `/etc/nginx/sites-available/default`) on the server and update it with the following configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/html/inventory-management;
    index index.html;

    location / {
        try_files $uri /index.html;
    }
}
```

- Replace `yourdomain.com` with your actual domain or IP address.
- Ensure the `root` path matches the location where you uploaded the `dist` files.

---

### 4. Restart Nginx

Save the configuration file and restart Nginx to apply the changes:

```bash
sudo systemctl restart nginx
```

This command will restart the Nginx service and apply your changes.

---

### 5. Access Your Application

Finally, navigate to your domain (e.g., `http://yourdomain.com`) in a browser. You should see your deployed React application.

---

## Troubleshooting

- If you encounter any issues, check the Nginx error log for details:
  ```bash
  sudo tail -f /var/log/nginx/error.log
  ```
- Ensure all file permissions are correct for the Nginx root directory.
- Verify that the server firewall allows traffic on port 80.

---

## Summary

By following the above steps, you have successfully deployed your React application using Nginx. Happy coding! 🚀

>>>>>>> 88dcf73 (Hr Management)
