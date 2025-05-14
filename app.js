const express = require('express')

const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'covid19India.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

//GET States API

app.get('/states/', async (request, response) => {
  const getStatesQuery = `
        SELECT 
        *
        FROM 
        state
        ORDER BY 
        state_id;`
  const statesArray = await db.all(getStatesQuery)
  response.send(statesArray)
})

//GET state API

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
  SELECT 
  *
  FROM 
  state
  WHERE 
  state_id = ${stateId}`
  const stateArray = await db.get(getStateQuery)
  response.send(stateArray)
})

//POST district API

app.post('/districts/', async (request, response) => {
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails

  const addDistrictQuery = `
    INSERT INTO
      district (district_name, state_id, cases, cured, active, deaths)
    VALUES
      (
        '${districtName}',
         ${stateId},
         ${cases},
         ${cured},
         ${active},
         ${deaths}
      );`

  const dbResponse = await db.run(addDistrictQuery)
  response.send('District Succefully Added')
})

//GET District API

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrict = `
  SELECT 
  *
  FROM 
  district
  WHERE 
  district_id = ${districtId}`
  const districtArray = await db.all(getDistrict)
  response.send(districtArray)
})

//DELETE district API

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteArray = `
  DELETE 
  FROM 
  district
  WHERE 
  district_id = ${districtId}`
  const deletedArray = await db.run(deleteArray)
  response.send('District Removed')
})

//UPDATE district API

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtUpdateDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} =
    districtUpdateDetails

  const updateDistrict = `
  UPDATE 
   district
  SET 
    district_name = '${districtName}',
    state_id = ${stateId},
    cases =    ${cases},
    cured =    ${cured},
    active =   ${active},
    deaths =   ${deaths}
  WHERE
    district_id = ${districtId};`
  await db.run(updateDistrict)
  response.send('District Details Updated')
})

//GET total Statistics API

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStateStatus = `
  SELECT 
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths)
  FROM 
  district
  WHERE 
  state_id = ${stateId};`
  const statusArray = await db.get(getStateStatus)
  console.log(statusArray)
  response.send({
    totalCases: statusArray['SUM(cases)'],
    totalCured: statusArray['SUM(cured)'],
    totalActive: statusArray['SUM(active)'],
    totalDeaths: statusArray['SUM(deaths)'],
  })
})

//GET SPECIFIC STATE API

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictIdQuery = `
  SELECT 
  state_id
  FROM 
  district
  WHERE 
  district_id = ${districtId}`
  const getDistrictArray = await db.get(getDistrictIdQuery)

  const getStateNameArray = `
  SELECT
  state_name as stateName
  FROM 
  state 
  where 
  state_id = ${getDistrictArray.state_id};`
  const getStateNameArrayResponse = await db.get(getStateNameArray)
  response.send(getStateNameArrayResponse)
})

module.exports = app
