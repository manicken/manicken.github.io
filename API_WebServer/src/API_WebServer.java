/* -*- mode: java; c-basic-offset: 2; indent-tabs-mode: nil -*- */

/*
  Part of the Processing project - http://processing.org

  Copyright (c) 2008 Ben Fry and Casey Reas

  This program is free software; you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation; either version 2 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program; if not, write to the Free Software Foundation,
  Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
*/

package com.API_WebServer;

import java.io.IOException;
import java.io.OutputStream;
import java.io.InputStream;
import java.io.*;
import java.net.InetSocketAddress;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.UnknownHostException;
import java.nio.ByteBuffer;
import java.util.Collections;
import org.java_websocket.WebSocket;
import org.java_websocket.drafts.Draft;
import org.java_websocket.drafts.Draft_6455;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

//import javax.swing.JOptionPane;
import processing.app.BaseNoGui;
import processing.app.Editor;
import processing.app.tools.Tool;
import processing.app.Sketch;
import processing.app.EditorTab;
import processing.app.SketchFile;
import processing.app.EditorHeader;
import processing.app.EditorConsole;

import java.util.Scanner;

import java.lang.reflect.*;

import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;

import static processing.app.I18n.tr;

import javax.swing.JOptionPane;
import javax.lang.model.util.ElementScanner6;
import javax.swing.*;
import javax.swing.text.*;

import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;
import java.awt.*;

import java.nio.file.Path;

import org.json.*;

import java.awt.Desktop;
import java.net.URI;

class ConfigDialog extends JPanel
{
	private JLabel lblServerport;
	public JCheckBox chkAutostart;
    public JTextField txtServerport;

    public ConfigDialog() {
        //construct components
		lblServerport = new JLabel ("Server Port");
        chkAutostart = new JCheckBox ("Autostart Server at Arduino IDE start");
        txtServerport = new JTextField (5);

        //adjust size and set layout
        setPreferredSize (new Dimension (263, 129));
        setLayout (null);

        //add components
		add (lblServerport);
        add (chkAutostart);
        add (txtServerport);

        //set component bounds (only needed by Absolute Positioning)
        lblServerport.setBounds (5, 5, 100, 25);
        txtServerport.setBounds (85, 5, 100, 25);
        chkAutostart.setBounds (4, 30, 232, 30);
    }

}

/**
 * Example Tools menu entry.
 */
public class API_WebServer implements Tool {
	Editor editor;
	
	Sketch sketch; // for the API
	ArrayList<EditorTab> tabs; // for the API uses reflection to get
	EditorHeader header; // for the API uses reflection to get
	Runnable runHandler; // for the API uses reflection to get
	Runnable presentHandler; // for the API uses reflection to get
	
	JMenu toolsMenu;
	
	HttpServer server;
	
	int DefaultServerPort = 8080;
	boolean DefaultAutoStart = true;
	String thisToolMenuTitle = "API Web Server";
	String rootDir;
	
	int serverPort = 8080; // replaced by code down
	boolean autostart = true; // replaced by code down
	
	boolean started = false;
	public ChatServer cs;

	EditorConsole editorConsole;
	private ConsoleOutputStream2 out;
	private ConsoleOutputStream2 err;
	private SimpleAttributeSet console_stdOutStyle;
	private SimpleAttributeSet console_stdErrStyle;

	public synchronized void setCurrentEditorConsole() {
		if (out == null) {
		  out = new ConsoleOutputStream2(console_stdOutStyle, System.out, cs);
		  System.setOut(new PrintStream(out, true));
	
		  err = new ConsoleOutputStream2(console_stdErrStyle, System.err, cs);
		  System.setErr(new PrintStream(err, true));
		}
	
		out.setCurrentEditorConsole(editorConsole);
		err.setCurrentEditorConsole(editorConsole);
	  }

	public void init(Editor editor) { // required by tool loader
		this.editor = editor;

		editor.addWindowListener(new WindowAdapter() {
			public void windowOpened(WindowEvent e) {
			  init();
			}
		});
		
	}
	/*private void SystemOutHookStart()
	{
		PrintStream myStream = new PrintStream(System.out) {
			@Override
			public void println(String x) {
				//if (cs != null)
				//cs.broadcast(x);
				super.println("hello world:" + x);
			}
			public void print(String x) {
				//if (cs != null)
				//cs.broadcast(x);
				super.print("hello world:" + x);
			}
		};
		System.setOut(myStream);
	}*/
	public void run() {// required by tool loader
		LoadSettings();
		startWebServer();
		//SystemOutHookStart();
		startWebsocketServer();		
		//System.out.println("Hello World!");
	}
	public void startWebsocketServer()
	{
		try {
			cs = new ChatServer(3000);
			cs.start();
			} catch (Exception e)
			{
				System.err.println("cannot start websocket server!!!");
				e.printStackTrace();
			}
	}
	public String getMenuTitle() {// required by tool loader
		return thisToolMenuTitle;
	}
	
	private void init()
	{
		if (started)
		{
			System.out.println("Server is allready running at port " + serverPort);
			return;
		}
		System.out.println("init API_WebServer");
		rootDir = GetArduinoRootDir();
		System.out.println("rootDir="+rootDir);
		try{
			Field f ;
			//Field f = Editor.class.getDeclaredField("sketch");
			//f.setAccessible(true);
			//sketch = (Sketch) f.get(this.editor);
			sketch = this.editor.getSketch();
			
			f = Editor.class.getDeclaredField("console");
			f.setAccessible(true);
			editorConsole = (EditorConsole) f.get(this.editor);

			f = EditorConsole.class.getDeclaredField("stdOutStyle");
			f.setAccessible(true);
			console_stdOutStyle = (SimpleAttributeSet) f.get(this.editorConsole);

			f = EditorConsole.class.getDeclaredField("stdErrStyle");
			f.setAccessible(true);
			console_stdErrStyle = (SimpleAttributeSet) f.get(this.editorConsole);

			f = Editor.class.getDeclaredField("tabs");
			f.setAccessible(true);
			tabs = (ArrayList<EditorTab>) f.get(this.editor);
			
			f = Editor.class.getDeclaredField("header");
			f.setAccessible(true);
			header = (EditorHeader) f.get(this.editor);
			
			f = Editor.class.getDeclaredField("runHandler");
			f.setAccessible(true);
			runHandler = (Runnable) f.get(this.editor);
			
			f = Editor.class.getDeclaredField("presentHandler");
			f.setAccessible(true);
			presentHandler = (Runnable) f.get(this.editor);
			
			f = Editor.class.getDeclaredField("toolsMenu");
			f.setAccessible(true);
			toolsMenu = (JMenu) f.get(this.editor);
			
			int thisToolIndex = GetMenuItemIndex(toolsMenu, thisToolMenuTitle);
			JMenu thisToolMenu = new JMenu(thisToolMenuTitle);		
			toolsMenu.insert(thisToolMenu, thisToolIndex+1);
			toolsMenu.remove(thisToolIndex);
			
			JMenuItem newItem = new JMenuItem("Start/Restart Server");
			thisToolMenu.add(newItem);
			newItem.addActionListener(event -> run());
			
			newItem = new JMenuItem("Settings");
			thisToolMenu.add(newItem);
			newItem.addActionListener(event -> ShowConfigDialog());

			newItem = new JMenuItem("Start GUI Tool");
			thisToolMenu.add(newItem);
			newItem.addActionListener(event -> StartGUItool());

			started = true;

			
			
		}catch (Exception e)
		{
			sketch = null;
			tabs = null;
			System.err.println("cannot reflect:");
			e.printStackTrace();
			System.err.println("API_WebServer not started!!!");
			return;
		}
		LoadSettings();
		if (autostart)
		{
			startWebServer();
			startWebsocketServer();
			setCurrentEditorConsole();
		}
	}
	public void StartGUItool()
	{
		try {
			File htmlFile = new File(rootDir + "/hardware/teensy/avr/libraries/Audio/gui/index.html");
			Desktop.getDesktop().browse(htmlFile.toURI());
			System.out.println("Web page opened in browser");
		} catch (Exception e) {
		    e.printStackTrace();
		}
	}
	public void ShowConfigDialog()
	{
		ConfigDialog cd = new ConfigDialog();
		//cd.setPreferredSize(new Dimension(100, 100)); // set in ConfigDialog code
		cd.txtServerport.setText(Integer.toString(serverPort));
		cd.chkAutostart.setSelected(autostart);
		
	   int result = JOptionPane.showConfirmDialog(editor, cd, "API Web Server Config" ,JOptionPane.OK_CANCEL_OPTION, JOptionPane.PLAIN_MESSAGE);
			
		if (result == JOptionPane.OK_OPTION) {
			serverPort = Integer.parseInt(cd.txtServerport.getText());
			autostart = cd.chkAutostart.isSelected();
			System.out.println(serverPort + " " + autostart);
			SaveSettings();
		} else {
			System.out.println("Cancelled");
		}
	}
	public int GetMenuItemIndex(JMenu menu, String name)
	{
		//System.out.println("try get menu: " + name);
		for ( int i = 0; i < menu.getItemCount(); i++)
		{
			//System.out.println("try get menu item @ " + i);
			JMenuItem item = menu.getItem(i);
			if (item == null) continue; // happens on seperators
			if (item.getText() == name)
				return i;
		}
		return -1;
	}
	public String GetArduinoRootDir()
	{
	  try{
	    File file = new File(API_WebServer.class.getProtectionDomain().getCodeSource().getLocation().toURI());
	    return file.getParentFile().getParentFile().getParentFile().getParent();
	    }catch (Exception e) {
	    e.printStackTrace();
	      return "";
	    }
	}
	public String GetJarFileDir()
	{
	  try{
	    File file = new File(API_WebServer.class.getProtectionDomain().getCodeSource().getLocation().toURI());
	    return file.getParent();
	    }catch (Exception e) {
	    e.printStackTrace();
	      return "";
	    }
	}
	
	public void LoadDefaultSettings()
	{
		serverPort = DefaultServerPort;
		autostart = DefaultAutoStart;
		System.out.println("Default Settings Used, serverPort=" + serverPort + ", autostart=" + autostart);
	}
	
	public File GetSettingsFile()
	{
		//File file = new File("tools/API_WebServer/tool/settings.json"); // works on windows
		//if (file.exists()) return file;
		File file = new File(GetJarFileDir() + "/settings.json"); // works on linux and windows
		if (file.exists()) return file;
		System.out.println("setting file not found!");
		return null;
	}
	
	public void LoadSettings()
	{
		File file = GetSettingsFile();
		if (file == null) { LoadDefaultSettings(); return;}
		
		String content = "";
		try { content = new Scanner(file).useDelimiter("\\Z").next(); } 
		catch (Exception e) {e.printStackTrace(); LoadDefaultSettings(); return; }
		JSONObject jsonObj = new JSONObject(content);
			
		try {serverPort = jsonObj.getInt("serverPort");} 
		catch (Exception e) { e.printStackTrace(); serverPort = DefaultServerPort; System.out.println("Default used for serverPort=" + serverPort);}
		
		try {autostart = jsonObj.getBoolean("autostart");}
		catch (Exception e) { e.printStackTrace(); autostart = DefaultAutoStart; System.out.println("Default used for autostart=" + autostart);}
	}
	
	public void SaveSettings()
	{
		try {
            // Constructs a FileWriter given a file name, using the platform's default charset
            FileWriter file = new FileWriter(GetJarFileDir() + "/settings.json");
            StringWriter stringWriter = new StringWriter();
			JSONWriter writer = new JSONWriter(stringWriter);
			writer.object().key("serverPort").value(serverPort).key("autostart").value(autostart).endObject();

			System.out.println(stringWriter.getBuffer().toString());
			file.write(stringWriter.getBuffer().toString());

			file.close();
        } catch (IOException e) {
            e.printStackTrace();
 
        }
	}
	
	private void startWebServer()
	{
		if (server != null)
			try { server.stop(1); } catch (Exception e) {System.err.println(e + " @ " + e.getStackTrace() + e.getStackTrace()[0].getLineNumber());}
	  try {
		server = HttpServer.create(new InetSocketAddress("localhost", serverPort), 0);
		server.createContext("/", new  MyHttpHandler(editor, this));
		server.setExecutor(null);
		server.start();

		System.out.println(" Server started on port " + serverPort);
	  } catch (Exception e) {
		e.printStackTrace();
	  }
	}
	
	public String getFile(String name)
	{
		File file = new File(sketch.getFolder(), name);
		boolean exists = file.exists();
		if (exists)
		{
			
			try {
				String content = new Scanner(file).useDelimiter("\\Z").next();
				return content;
			} catch (Exception e) {
				e.printStackTrace();
				return "";
			}
		}
		else
		{
			System.out.println(name + " file not found!");
			return "";
		}
	}
	public void setFile(String name, String contents)
	{
		try {
            // Constructs a FileWriter given a file name, using the platform's default charset
            FileWriter file = new FileWriter(sketch.getFolder() + "/" + name);
			file.write(contents);
			file.close();
        } catch (IOException e) {
            e.printStackTrace();
 
        }
	}
	
	public void RemoveFilesNotInJSON(JSONArray arr)
	{
		System.out.println("RemoveFilesNotInJSON");
		ArrayList<String> filesToRemove = new ArrayList<String>();
		
		// this removes files in the sketch that is not present in the 
		// JSONArray. To not interfere with the current sketch.getCodeCount()
		// it stores filenames to be removed in a temporary Array
		for (int i = 0; i < sketch.getCodeCount(); i++)
		{
			SketchFile sf = sketch.getFile(i);
			if (sf.isPrimary()) continue; // never remove primary sketch ino file
			
			String fileName = sf.getFileName();
			if (!CheckIfFileExistsInJsonArray(fileName, arr))
				filesToRemove.add(fileName); // store it for later
		}
		// now it can remove files 
		for (int i = 0; i < filesToRemove.size(); i++)
		{
			String fileName = filesToRemove.get(i);
			System.out.println("Removing file:" + fileName);
			removeFile(fileName);
		}
	}
	private boolean CheckIfFileExistsInJsonArray(String fileName, JSONArray arr)
	{
		//System.out.println("CheckIfFileExistsInJsonArray:" + fileName);
		for (int i = 0; i < arr.length(); i++)
		{
			JSONObject e = arr.getJSONObject(i);
			String name = e.getString("name");
			//System.out.println("against: " + name);
			if (name.equals(fileName))
				return true;
		}
		return false;
	}
	
	public void editor_addTab(SketchFile sketchFile, String contents)
	{
		try {
		Method m = Editor.class.getDeclaredMethod("addTab", SketchFile.class, String.class);
		m.setAccessible(true);
		m.invoke(editor, sketchFile, contents);
		}
		catch (Exception e)
		{
			System.err.println("cannot invoke editor_addTab");
			e.printStackTrace();
		}
	}
	public void sketch_removeFile(SketchFile sketchFile)
	{
		try {
		Method m = Sketch.class.getDeclaredMethod("removeFile", SketchFile.class);
		m.setAccessible(true);
		m.invoke(sketch, sketchFile);
		}
		catch (Exception e)
		{
			System.err.println("cannot invoke sketch_removeFile");
			e.printStackTrace();
		}
	}
	public void editor_removeTab(SketchFile sketchFile)
	{
		try {
		Method m = Editor.class.getDeclaredMethod("removeTab", SketchFile.class);
		m.setAccessible(true);
		m.invoke(editor, sketchFile);
		}
		catch (Exception e)
		{
			System.err.println("cannot invoke editor_removeTab");
			e.printStackTrace();
		}
	}
	public boolean sketchFile_delete(SketchFile sketchFile)
	{
		try {
		Method m = SketchFile.class.getDeclaredMethod("delete", Path.class);
		m.setAccessible(true);
		return (boolean)m.invoke(sketchFile, sketch.getBuildPath().toPath());
		}
		catch (Exception e)
		{
			System.err.println("cannot invoke sketchFile_delete");
			e.printStackTrace();
			return false;
		}
	}
	public boolean sketchFile_fileExists(SketchFile sketchFile)
	{
		try {
		Method m = SketchFile.class.getDeclaredMethod("fileExists");
		m.setAccessible(true);
		return (boolean)m.invoke(sketchFile);
		}
		catch (Exception e)
		{
			System.err.println("cannot invoke sketchFile_fileExists");
			e.printStackTrace();
			return false;
		}
	}
	
	public boolean addNewFile(String fileName, String contents) // for the API
	{
		File folder;
		try 
		{
			folder = sketch.getFolder();
		}
		catch (Exception e)
		{
			System.err.println(e);
			return false;
		}
		//System.out.println("folder: " + folder.toString());
		File newFile = new File(folder, fileName);
		int fileIndex = sketch.findFileIndex(newFile);
		if (fileIndex >= 0) { // file allready exist, just change the contents.
		  tabs.get(fileIndex).setText(contents);
		  System.out.println("file allready exists " + fileName);
		  return true;
		}
		SketchFile sketchFile;
		try {
		  sketchFile = sketch.addFile(fileName);
		} catch (IOException e) {
		  // This does not pass on e, to prevent showing a backtrace for
		  // "normal" errors.
		  e.printStackTrace();
		  
		  return false;
		}
		editor_addTab(sketchFile, contents);
		System.out.println("added new file " + fileName);
		editor.selectTab(editor.findTabIndex(sketchFile));
		
		return true;
	}
	public boolean removeFile(String fileName) // for the API, so that files could be removed
	{
		File newFile = new File(sketch.getFolder(), fileName);
		int fileIndex = sketch.findFileIndex(newFile);
		if (fileIndex >= 0) { // file exist
		    SketchFile sketchFile = sketch.getFile(fileIndex);
			boolean neverSavedTab = !sketchFile_fileExists(sketchFile);
			
			if (!sketchFile_delete(sketchFile) && !neverSavedTab) {
				System.err.println("Couldn't remove the file " + fileName);
				return false;
			}
			if (neverSavedTab) {
				// remove the file from the sketch list
				sketch_removeFile(sketchFile);
			}
			editor_removeTab(sketchFile);

			// just set current tab to the main tab
			editor.selectTab(0);

			// update the tabs
			header.repaint();
			return true;
		}
		System.err.println("file don't exists in sketch " + fileName);
		return false;
	}
	public boolean renameFile(String oldFileName, String newFileName) // for the API, so that it can rename files
	{
		File newFile = new File(sketch.getFolder(), oldFileName);
		int fileIndex = sketch.findFileIndex(newFile);
		if (fileIndex >= 0) { // file exist
		  SketchFile sketchFile = sketch.getFile(fileIndex);
		  try {
			sketchFile.renameTo(newFileName);
			// update the tabs
			header.rebuild();
			return true;
		  } catch (IOException e) {
			e.printStackTrace();
		  }
		}
		return false;
	}
	
	public void verifyCompile() 
	{
		editor.setAlwaysOnTop(false);
		editor.setAlwaysOnTop(true);
		editor.setAlwaysOnTop(false);
		editor.handleRun(false, presentHandler, runHandler);
	}
	public void upload()
	{
		editor.setAlwaysOnTop(false);
		editor.setAlwaysOnTop(true);
		editor.setAlwaysOnTop(false);
		editor.handleExport(false);
	}
	public String parseGET(Map<String, String> query)
	{
		String cmd = query.get("cmd");
		//if (!cmd.equals("ping"))
		//	System.out.println("GET request params: " + cmd);
		if (cmd.equals("ping"))
		{
			// do nothing, a OK is default to send back
		}
		else if (cmd.equals("compile"))
		{
			verifyCompile();
			System.out.println("WSAPI compile");
		}
		else if (cmd.equals("upload"))
		{   
			upload();
			System.out.println("WSAPI upload");
		}
		else if (cmd.equals("renameFile"))
		{
			String from = query.get("from");
			if (from == null) { System.out.println("Missing 'from' parameter @ renameFile"); return "Missing 'from' parameter @ renameFile"; }
			String to = query.get("to");
			if (to == null) { System.out.println("Missing 'to' parameter @ renameFile"); return "Missing 'to' parameter @ renameFile"; }
			System.out.println("WSAPI renameFile from:" + from + ", to:" + to);
			renameFile(from, to);
		}
		else if (cmd.equals("removeFile"))
		{
			String name = query.get("fileName");
			if (name == null) { System.out.println("Missing 'fileName' parameter @ removeFile"); return "Missing 'fileName' parameter @ removeFile"; }
			System.out.println("WSAPI removeFile:" + name);
			removeFile(name);
		}
		else if(cmd.equals("getFile"))
		{
			String name = query.get("fileName");
			if (name == null) { System.out.println("Missing 'fileName' parameter @ getFile"); return "Missing 'fileName' parameter @ getFile"; }
			System.out.println("WSAPI getFile:" + name);
			return getFile(name);
		}
		else
			return "unknown GET cmd: " + cmd;

		return "OK"; // default
	}
	public synchronized String parsePOST(String data)
	{
		JSONObject jsonObj = new JSONObject(data);
		Boolean removeOtherFiles = jsonObj.getBoolean("removeOtherFiles"); // this should be implemented later
		JSONArray arr = jsonObj.getJSONArray("files");
		
		if (removeOtherFiles) {
			try{RemoveFilesNotInJSON(arr);}
			catch (Exception e) {e.printStackTrace();}
		}
		for (int i = 0; i < arr.length(); i++)
		{
			JSONObject e = arr.getJSONObject(i);
			String name = e.getString("name");
			String contents = e.getString("contents");
			if (name.endsWith(".cpp") || name.endsWith(".c") || name.endsWith(".h") || name.endsWith(".hpp") || name.endsWith(".ino"))
				addNewFile(name, contents); // adds a new file to the sketch-project
			else
				setFile(name, contents); // this writes a file without the IDE knowing it
		}
		//System.out.println(data);
		editor.handleSave(true);
		return "OK";
	}
}
class MyHttpHandler implements HttpHandler
{    
	Editor editor;
	API_WebServer api;

	public MyHttpHandler(Editor _editor, API_WebServer _api)
	{
		this.editor = _editor;
		this.api = _api;
	}
	
	@Override    
	public void handle(HttpExchange httpExchange) throws IOException {
		httpExchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
		
		String reqMethod = httpExchange.getRequestMethod();
		String htmlResponse = "";
		String requestParamValue=null; 
		
		if(reqMethod.equals("GET"))
		{
			htmlResponse = api.parseGET(queryToMap(httpExchange.getRequestURI().getQuery()));
		}
		else if(reqMethod.equals("POST"))
		{ 
			requestParamValue = handlePostRequest(httpExchange);
			if (requestParamValue.length() == 0)
			{
				System.out.println("HTTP POST don't contain any data!");
				htmlResponse = "";
			}
			else
			{
				htmlResponse = api.parsePOST(requestParamValue);
			}
		}
		else
		{
			System.out.println("unknown reqMethod:" + reqMethod);
			htmlResponse = "unknown reqMethod:" + reqMethod;
		}
		//System.out.println(requestParamValue); // debug
		handleResponse(httpExchange, htmlResponse); 
	}

	public Map<String, String> queryToMap(String query) {
		Map<String, String> result = new HashMap<>();
		for (String param : query.split("&")) {
			String[] entry = param.split("=");
			if (entry.length > 1) {
				result.put(entry[0], entry[1]);
			}else{
				result.put(entry[0], "");
			}
		}
		return result;
	}
	
	private String handlePostRequest(HttpExchange httpExchange) {
		if (httpExchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
            httpExchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, OPTIONS");
            httpExchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type,Authorization");
            try{
			httpExchange.sendResponseHeaders(200, 0);
			} catch (Exception e) {
			e.printStackTrace();
			}
			System.out.println("hi");
            return "";
        }
		InputStream input = httpExchange.getRequestBody();
        StringBuilder stringBuilder = new StringBuilder();

        new BufferedReader(new InputStreamReader(input))
                          .lines()
                          .forEach( (String s) -> stringBuilder.append(s + "\n") );

		return stringBuilder.toString();
	}

	private void handleResponse(HttpExchange httpExchange, String htmlResponse)  throws  IOException {
		OutputStream outputStream = httpExchange.getResponseBody();

		// this line is a must
		httpExchange.sendResponseHeaders(200, htmlResponse.length());
		// additional data to send back
		outputStream.write(htmlResponse.getBytes());
		outputStream.flush();
		outputStream.close();
	}
}
class ChatServer extends WebSocketServer {

	public ChatServer(int port) throws UnknownHostException {
	  super(new InetSocketAddress(port));
	}
  
	public ChatServer(InetSocketAddress address) {
	  super(address);
	}
  
	public ChatServer(int port, Draft_6455 draft) {
	  super(new InetSocketAddress(port), Collections.<Draft>singletonList(draft));
	}
  
	@Override
	public void onOpen(WebSocket conn, ClientHandshake handshake) {
	  conn.send("Welcome to the server!"); //This method sends a message to the new client
	  broadcast("new connection: " + handshake
		  .getResourceDescriptor()); //This method sends a message to all clients connected
	  System.out.println(
		  conn.getRemoteSocketAddress().getAddress().getHostAddress() + " entered the room!");
	}
  
	@Override
	public void onClose(WebSocket conn, int code, String reason, boolean remote) {
	  broadcast(conn + " has left the room!");
	  System.out.println(conn + " has left the room!");
	}
  
	@Override
	public void onMessage(WebSocket conn, String message) {
	  broadcast(message);
	  System.out.println(conn + ": " + message);
	}
  
	@Override
	public void onMessage(WebSocket conn, ByteBuffer message) {
	  broadcast(message.array());
	  System.out.println(conn + ": " + message);
	}
  
  
	/*public static void main(String[] args) throws InterruptedException, IOException {
	  int port = 8887; // 843 flash policy port
	  try {
		port = Integer.parseInt(args[0]);
	  } catch (Exception ex) {
	  }
	  ChatServer s = new ChatServer(port);
	  s.start();
	  System.out.println("ChatServer started on port: " + s.getPort());
  
	  BufferedReader sysin = new BufferedReader(new InputStreamReader(System.in));
	  while (true) {
		String in = sysin.readLine();
		s.broadcast(in);
		if (in.equals("exit")) {
		  s.stop(1000);
		  break;
		}
	  }
	}*/
  
	@Override
	public void onError(WebSocket conn, Exception ex) {
	  ex.printStackTrace();
	  if (conn != null) {
		// some errors like port binding failed may not be assignable to a specific websocket
	  }
	}
  
	@Override
	public void onStart() {
	  System.out.println("Websocket Server started!");
	  setConnectionLostTimeout(0);
	  setConnectionLostTimeout(100);
	}
  
  }
  class ConsoleOutputStream2 extends ByteArrayOutputStream {

	private SimpleAttributeSet attributes;
	private final PrintStream printStream;
	private final Timer timer;
  
	private volatile EditorConsole editorConsole;
	private volatile boolean newLinePrinted;

	private ChatServer cs;
	Color fgColor;
	String fgColorHex;
	Color bgColor;
	String bgColorHex;
  
	public ConsoleOutputStream2(SimpleAttributeSet attributes, PrintStream printStream, ChatServer cs) {
	  this.cs = cs;
	  this.attributes = attributes;
	  this.printStream = printStream;
	  this.newLinePrinted = false;
	
	  fgColor = StyleConstants.getForeground(attributes);
	  fgColorHex = "#" + Integer.toHexString(fgColor.getRGB() | 0xFF000000).substring(2);
	  bgColor = StyleConstants.getBackground(attributes);
	  bgColorHex = "#" + Integer.toHexString(bgColor.getRGB() | 0xFF000000).substring(2);

	  this.timer = new Timer(100, (e) -> {
		if (editorConsole != null && newLinePrinted) {
		  editorConsole.scrollDown();
		  newLinePrinted = false;
		}
	  });
	  timer.setRepeats(false);
	}
  
	public void setAttibutes(SimpleAttributeSet attributes) {
	  this.attributes = attributes;
	}
  
	public void setCurrentEditorConsole(EditorConsole console) {
	  this.editorConsole = console;
	}
  
	public synchronized void flush() {
	  String text = toString();
  
	  if (text.length() == 0) {
		return;
	  }
  
	  printStream.print(text);
	  printInConsole(text);
  
	  reset();
	}
  
	private void printInConsole(String text) {
	  newLinePrinted = newLinePrinted || text.contains("\n");
	  if (editorConsole != null) {
		SwingUtilities.invokeLater(() -> {
		  try { editorConsole.insertString(text, attributes); } 
		  catch (BadLocationException ble) { /*ignore*/ }

		  try { cs.broadcast("<span style=\"color:"+fgColorHex+";background-color:"+bgColorHex+";\">" + text.replace("\r\n", "<br>").replace("\r", "<br>").replace("\n", "<br>") + "</span>"); }
		  catch (Exception ex) { /*ignore*/ }

		});
  
		if (!timer.isRunning()) {
		  timer.restart();
		}
	  }
	}
  }