# Tokensystem

A token generation system.

Backend - Node.js (Google Cloud functions)
Frontend - Angular
Database - Cloud Firestore

## Setup For Development
### Prerequisites:
- Node - v12+

### Steps:

1. Clone the git repository from: https://github.com/manas99/tokensystem.git

2. In terminal, change current working directory to the `tokensystem` directory.

3. Install the required packages with `npm install`

4. `ng serve` to serve the website locally.


## Notes:
- Create a composite index
Collection ID - tokens
Fields - user: ASC; slot_int: DESC;
Query scope - Collection

- Add an exemption
Collection ID - employees
Field path - complete_phone
Query scope - Collection group
Index -Ascending

- Create a composite index
Collection ID - tokens
Fields - date_str: ASC; status: ASC; store: ASC; slot_int: ASC;
Query scope - Collection
