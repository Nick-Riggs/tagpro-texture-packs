const fs = require("node:fs");
const pngcrush = require("pngcrush");

const { question } = require("readline-sync");
const { Readable } = require("node:stream");
const { pipeline } = require("node:stream/promises");

async function main() {
    const name = question("Display Name: ");
    const directory = question("Directory Name [$<defaultInput>]: ", { defaultInput: name.toLowerCase().replaceAll(/[^a-z0-9]/g, "") });
    const author = question("Author: ");
    const sharepack = question("SharePack: ");

    console.log("");

    // Create directory

    if (fs.existsSync(directory))
        throw new Error("Directory already exists");

    fs.mkdirSync(directory);

    // Download files

    const codes = sharepack.split("|");
    const files = "tiles|speedpad|speedpadred|speedpadblue|portal|portalred|portalblue|splats|gravitywell".split("|");

    for (const i in codes) {
        const code = codes[i];
        const file = files[i];

        const url = `https://i.imgur.com/${code}.png`;
        const path = `${directory}/${file}.png`;

        console.log("Downloading %s -> %s", url, path);

        const response = await fetch(url);
        if (!response.ok)
            throw new Error(`Error: ${response.status}`);

        const type = response.headers.get("content-type");
        if (type !== "image/png")
            throw new Error(`Unexpected content-type: ${type}`);

        const input = Readable.fromWeb(response.body);
        const crusher = new pngcrush(["-rem", "allb", "-reduce"]);
        const output = fs.createWriteStream(path);

        await pipeline(input, crusher, output);
    }

    // Update index file

    const index = "texturepacks.json";

    console.log("");
    console.log(`Updating ${index}`);

    const packs = JSON.parse(fs.readFileSync(index));

    packs.push({
        name,
        author,
        url: directory,
    });

    const lines = packs.map(pack =>
        "    { " +
        `"name": ${JSON.stringify(pack.name)}, ` +
        `"author": ${JSON.stringify(pack.author)}, ` +
        `"url": ${JSON.stringify(pack.url)}` +
        "}"
    );

    fs.writeFileSync(
        index,
        "[\n" +
        lines.join(",\n") +
        "\n]\n"
    );

    console.log("Done");
}

main();
