import { createClient } from "redis";

const client = createClient({
    url: process.env.REDIS_URL,
    password: process.env.REDIS_PASSWORD
});

(async () => {
    await client.connect();
})();

client.on("error", err => {
    console.log("Redis error: ", err);
});

export default client;