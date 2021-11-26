const axios = require('axios')
const fs = require('fs')
const fsPromises = fs.promises;
const path = require('path')


async function fetch_list_most_recent(n) {
    return await fetch_list(10,n);
}

async function fetch_list_most_installed(n) {
    return await fetch_list(4,n);
}
async function fetch_list(sortBy,n) {
    
    try {
        const res = await axios({
            method: 'post',
            url: 'https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery?api-version=5.1-preview',
            responseType: 'json',
            data: {
                "filters": [
                    {
                    "criteria": [
                        {
                            "filterType": 8,
                            "value": "Microsoft.VisualStudio.Code",
                        }
                    ],
                    "pageNumber": 1,
                    "pageSize": n,
                    "sortBy": sortBy, // see Readme for options
                    "sortOrder": 0,
                    }
                ],
                "assetTypes": ["Microsoft.VisualStudio.Services.VSIXPackage"],
                "flags": 514, // See readme for options
            }
        });
        await fsPromises.writeFile('test.json',JSON.stringify(res.data));
        return res.data;
    } catch(err) {
        console.error(err);
        throw(err);
    }
}

async function fetch_vsix_file(url,file) {
    if (fs.existsSync(file)) {
        console.log(`Skipping download to ${file} because it already exists`);
        return;
    }
    let done = false;
    while(!done) {    
        try {
            const res = await axios( {
                method: 'get',
                url: url,
                responseType: 'stream'
            })
            const folder = path.dirname(file);
            if(!fs.existsSync(folder)) {
                fs.mkdirSync(folder);
            }
            await res.data.pipe(fs.createWriteStream(file));
            console.log(`Downloaded ${url} -> ${file}`);
            done = true;
        } catch(err) {
            if(err.response && err.response.status === 429) {
                timeout = Number(err.response.headers['retry-after']) + 5;
                console.log(`HTTP 429; retrying in ${timeout} seconds ${url}`);
                await new Promise(r => setTimeout(r, timeout*1000));
            } else {
                console.error(err);
                throw(err);
            }
        }
    }
}

function get_download_params(ext_data) {
    const publisher = ext_data.publisher.publisherName;
    const extension = ext_data.extensionName;
    const version = ext_data.versions[0].version;
    
    if(!publisher) throw new Error("missing publisherName");
    if(!extension) throw new Error("missing extensionName");
    if(!version) throw new Error("missing version");
    
    return {
        url: `https://marketplace.visualstudio.com/_apis/public/gallery/publishers/${publisher}/vsextensions/${extension}/${version}/vspackage`,
        file: `downloads/${publisher}.${extension}-${version}.vsix`,
    };
}

async function demo() {
    const data = await fetch_list_most_installed(10);
    for(let ext of data.results[0].extensions) {
        const params = get_download_params(ext);
        await fetch_vsix_file(params.url,params.file);
    }
}
demo();
