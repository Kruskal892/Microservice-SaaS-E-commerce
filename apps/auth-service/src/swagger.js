import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    title: "Auth Service API",
    description: "Autogen doc",
    version: "1.0.0"
  },
  host: "localhost:6001",
  schemes: [ "http" ],
}


const outputFile = "./swagger-output.json";
const endPointsFiles = [ "./routes/auth.router.ts" ]

swaggerAutogen()(outputFile, endPointsFiles, doc)
