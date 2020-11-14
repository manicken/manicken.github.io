javac -cp "..\..\lib\pde.jar;..\..\lib\arduino-core.jar;tool\json-20200518.jar;tool\Java-WebSocket-1.5.1.jar" -d bin src\API_WebServer.java
cd bin
jar cvf API_WebServer.jar *
copy API_WebServer.jar ..\tool\API_WebServer.jar
cd ..
pause