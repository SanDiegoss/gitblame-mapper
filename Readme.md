# gitblame-mapper

## How to use

### .env configuration

```bash
  TOKEN="your_token"
  ```

### Install dependencies

* Production
  ```bash
    npm install --production
    ```
* Develop
  ```bash
    npm install --dev
  ```
* All
  ```bash
    npm install
  ```

### Running
* Production (compiling JS code, devDependecies not required)
  ```bash
    npm run build
    npm start
    ```
* Develop (no-compiling JS code, devDependecies required)
  ```bash
    ts-node "src\index.ts"
  ```