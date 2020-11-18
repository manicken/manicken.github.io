# api-webserver README

This extension make it possible to take control of Arduino IDE from a Web Page based client.


## Features

* POST request with data contents in json format:
```
{
    "files":[
        {
            "name":"Main.c",
            "contents":""
        },
        {
            "name":"Main.h",
            "contents":""
        }
    ],
    "removeOtherFiles":true
}
```
in above json:
removeOtherFiles mean that when this is set to true
 then files that is not present in the JSON is removed 
 from the sketch (note. the main sketch file is never touched)
 it should be set to false if only known files need to be replaced/added.

* GET request
possible query strings:
```
http://localhost:8080?cmd=getFile&fileName=fileNameWithExt
http://localhost:8080?cmd=renameFile&from=fromNameWithExt&to=toNameWithExt
http://localhost:8080?cmd=removeFile&fileName=fileNameWithExt
http://localhost:8080?cmd=compile
http://localhost:8080?cmd=upload
http://localhost:8080?cmd=ping
```



## Requirements
Java-WebSocket-1.5.1.jar (included) from https://github.com/TooTallNate/Java-WebSocket
json-20200518.jar (included) from https://github.com/stleary/JSON-java
## Extension Settings

## Known Issues
when using terminal capture and send (allways on in this version)
and using compile output with alot of data the data sent to client is alot after
and continues to output long after compilation is finished.
Fix is to not use compile output log. The result is allways printed.
## Release Notes

### 1.0.0

Initial release of API_Webserver

### 1.0.1

Add GET and POST requests

### 1.0.2

Add Settings file

### 1.0.3

Add terminal capture and send to connected WebSocket client

### 1.0.4

Add POST JSON data removeOtherFiles
Fix File write flag so that it overwrites existing files

-----------------------------------------------------------------------------------------------------------
