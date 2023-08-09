# Afrika Quiz Backend Instructions

#### To use it, follow below instructions :

## Clone repositories
1. `git clone https://ugeraud@bitbucket.org/afikaquizteam/afrikaquiz.git`
2. change branch `git branch ulrich`
3. `cd afrikaquiz/backend`

## Install `nodemon` on your system
1. `npm install -g nodemon`

## Config database information
1. `cd config/config.json`
2. enter your `database password` at `password` field
3. go to your `terminal` to create `database`
4. tape `mysql -u <your-user-name> -p `
5. enter your `database password`
6. tape and valid `create database database_development;`
7. tape and valid `create database database_test;`
8. tape and valid `create database database_production;`
9. quit your database terminal
10. open new terminal and do `sequelize db:migrate`
11. check in your database terminal that all is ok :
    `use database_development;`
    `describe Users;`
    and check table fields

## Start Server
1. `npm start`

## Use User Authentication API (login & register)
1. go to `Postman` app
2. choose `HTTP POST METHOD`
3. use URL below to `register an user`: `http://localhost:3000/api/user/register` and choose `Body > x-www-form-urlencoded`
4. put all user data key and value. Example: `key: email and value: test.example.com`
5. send data and verify the response sent by server
6. do the same for `login an user` and check the response