# 🥇 금 시세 모의 투자 시뮬레이션 (Gold Paper Trading)

## 📖 프로젝트 개요

이 프로젝트는 투자 초보자들이 실제 자본 없이 금 투자를 경험하고 학습할 수 있도록 돕는 웹 기반 모의 투자 시뮬레이션 플랫폼입니다. 사용자는 과거 금 시세 데이터를 기반으로 특정 기간 동안의 투자 수익률을 시뮬레이션하며 안전하게 투자 전략을 테스트할 수 있습니다.

이 문서는 프로젝트에 새로 참여하는 팀원들을 위한 초기 환경 설정 가이드입니다.

---

## 🛠️ 기술 스택

-   **Backend**: Spring Boot (Java 17)
-   **Frontend**: React (TypeScript, Vite)
-   **Database**: MySQL 8.0
-   **Deployment**: Docker

---

## 🚀 로컬 개발 환경 설정

프로젝트를 로컬 환경에서 실행하기 위해 아래 단계를 순서대로 진행해 주세요.

### 1. 사전 준비

-   [Git](https://git-scm.com/downloads)
-   Java 17 (JDK)
-   [Node.js](https://nodejs.org/) (LTS 버전 권장)
-   [Docker Desktop](https://www.docker.com/products/docker-desktop/)
-   IDE: IntelliJ (백엔드), VS Code (프론트엔드)
-   DB Tool: MySQL Workbench

### 2. 프로젝트 클론

```bash
git clone [GitHub 저장소 주소]
cd [프로젝트 폴더명]
```

### 3. 데이터베이스 설정 (Docker & MySQL)

1.  **Docker를 실행**하고 터미널에서 아래 명령어를 입력하여 MySQL 컨테이너를 생성하고 실행합니다.
    * 이 명령어는 데이터를 영구적으로 저장(`-v`)하고, 컴퓨터를 재시작할 때마다 자동으로 컨테이너를 실행(`--restart always`)합니다.

    ```bash
    docker run --name mysql-test -e MYSQL_ROOT_PASSWORD=1234 -p 3306:3306 -v mysql_data:/var/lib/mysql --restart always -d mysql:8.0
    ```

2.  MySQL Workbench를 사용하여 `localhost:3306` 서버에 접속합니다. (비밀번호: `1234`)

3.  새로운 스키마(데이터베이스)를 생성합니다. 이름은 반드시 `mydb`로 지정해 주세요.

4.  `mydb` 스키마를 선택한 후, 아래 SQL 쿼리를 실행하여 **회원 기능에 필요한 테이블**들을 생성합니다.

    ```sql
    CREATE TABLE `MEMBERS` (
      `MEMBER_NO` INT NOT NULL AUTO_INCREMENT,
      `MEMBER_ID` VARCHAR(50) NOT NULL,
      `MEMBER_PWD` VARCHAR(100) NOT NULL,
      `MEMBER_NAME` VARCHAR(50) NOT NULL,
      `MEMBER_EMAIL` VARCHAR(100) NOT NULL,
      `MEMBER_ROLE` VARCHAR(50) NOT NULL DEFAULT 'ROLE_USER',
      `MEMBER_IS_ACTIVE` TINYINT(1) NOT NULL DEFAULT 1,
      `MEMBER_CREATED_AT` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      `MEMBER_UPDATED_AT` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      `MEMBER_LAST_LOGIN_AT` DATETIME NULL DEFAULT NULL,
      `MEMBER_DELETED_AT` DATETIME NULL DEFAULT NULL,
      PRIMARY KEY (`MEMBER_NO`),
      UNIQUE KEY `UK_MEMBERS_MEMBER_ID` (`MEMBER_ID`),
      UNIQUE KEY `UK_MEMBERS_MEMBER_EMAIL` (`MEMBER_EMAIL`)
    );

    CREATE TABLE `MEMBER_AUTH` (
      `NO` INT NOT NULL AUTO_INCREMENT,
      `MEMBER_ID` VARCHAR(50) NOT NULL,
      `AUTH` VARCHAR(50) NOT NULL,
      PRIMARY KEY (`NO`),
      CONSTRAINT `FK_MEMBER_AUTH_MEMBER_ID` FOREIGN KEY (`MEMBER_ID`) REFERENCES `MEMBERS` (`MEMBER_ID`) ON DELETE CASCADE
    );
    ```

5.  **초기 금 시세 데이터**(`gold_input_data.csv`)를 `mydb`에 임포트합니다.
    * MySQL Workbench의 `Table Data Import Wizard` 기능을 사용합니다.
    * `gold_input_data`라는 이름의 새 테이블로 데이터를 임포트한 후, 아래 쿼리를 실행하여 실제 서비스 테이블인 `QUOTES_DAILY`로 데이터를 복사합니다. (참고: `QUOTES_DAILY` 테이블은 Spring Boot가 처음 실행될 때 자동으로 생성됩니다.)

    ```sql
    INSERT INTO QUOTES_DAILY (Date, ...) -- 컬럼명은 실제 테이블에 맞게 조정 필요
    SELECT STR_TO_DATE(Date, ...), ...   -- 데이터 형식에 맞게 조정 필요
    FROM gold_input_data;
    ```

### 4. 백엔드 실행

1.  IntelliJ에서 `backend` 폴더를 프로젝트로 엽니다.
2.  Gradle 의존성을 빌드합니다.
3.  `BackendApplication.java` 파일을 찾아 실행합니다. (`localhost:8080` 포트에서 서버가 실행됩니다.)

### 5. 프론트엔드 빌드

1.  VS Code에서 `backend/frontend` 폴더를 엽니다.
2.  터미널에서 아래 명령어를 실행하여 의존성을 설치합니다.
    ```bash
    npm install
    ```
3.  아래 명령어를 실행하여 React 프로젝트를 빌드합니다. 빌드 결과물은 `backend/src/main/resources/static` 폴더에 자동으로 저장됩니다.
    ```bash
    npm run build
    ```

### 6. 실행 확인

웹 브라우저에서 `http://localhost:8080` 주소로 접속하여 애플리케이션이 정상적으로 실행되는지 확인합니다.

---
