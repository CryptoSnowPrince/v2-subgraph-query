const axios = require('axios');
const gql = require('graphql-tag');
const fs = require('fs');
const { print } = require('graphql');

const SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/cryptosnowprince/v2-subgraph';
const maxFileSize = 1024 * 1024; // 1 MB as an example limit

let logStream;

function createLogStream() {
    const logFilePath = `app_${new Date().getTime()}.log`; // Unique log file name
    logStream = fs.createWriteStream(logFilePath, { flags: 'a' }); // 'a' flag for append mode
}

function logMessage(message) {
    if (!logStream) {
        createLogStream();
    }

    const log = `${new Date().toISOString()} - ${message}\n`;

    logStream.write(log, (err) => {
        if (err) {
            console.error('Error writing to log file:', err);
        } else {
            fs.stat(logStream.path, (err, stats) => {
                if (err) {
                    console.error('Error getting file stats:', err);
                } else {
                    if (stats.size >= maxFileSize) {
                        logStream.end(); // Close the current stream
                        createLogStream(); // Create a new log file
                    }
                }
            });
        }
    });
}

async function querySubgraph(query, variables = {}) {
    try {
        const response = await axios.post(SUBGRAPH_URL, {
            query: print(query),
            variables,
        }, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        return JSON.stringify(response.data.data); // Accessing data property of GraphQL response
    } catch (error) {
        // Handle errors here. For example, you could throw them or log them
        console.error(error);
        throw error;
    }
}

const MY_QUERY = gql`
query GetPairs($recent: Int!) {
    pairCreateds(first: $recent) {
      token0
      token1
      pair
    }
  }
`

async function main() {
    let idx = 1;
    try {
        logMessage(`start querySubgraph`);
        setInterval(async () => {
            logMessage(`querySubgraph ${idx}`);
            idx++;
            const id = idx % 50 + 1;
            logMessage(`value ${id}`);
            querySubgraph(MY_QUERY, { recent: id })
                .then(data => logMessage(data))
                .catch(error => logMessage(error));
        }, 500);
    } catch (error) {
        logMessage('querySubgraph catch error: ', error);
    }
}

main()