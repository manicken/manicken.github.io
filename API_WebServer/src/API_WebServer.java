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

import java.util.Scanner;

import java.lang.reflect.*;

import java.util.ArrayList;

import static processing.app.I18n.tr;

import javax.swing.JOptionPane;
import javax.swing.*;

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

	public void init(Editor editor) { // required by tool loader
		this.editor = editor;

		editor.addWindowListener(new WindowAdapter() {
			public void windowOpened(WindowEvent e) {
			  init();
			}
		});
		
	}
	public void run() {// required by tool loader
		LoadSettings();
		startServer();
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
			startServer();
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
	
	private void startServer()
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
	
	public String getJSON()
	{
		File file = new File(sketch.getFolder(), "GUI_TOOL.json");
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
			System.out.println("GUI_TOOL.json file not found!");
			return "";
		}
	}
	public void SetJSON(String contents)
	{
		try {
            // Constructs a FileWriter given a file name, using the platform's default charset
            FileWriter file = new FileWriter(sketch.getFolder() + "/GUI_TOOL.json");
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
		editor.handleRun(false, presentHandler, runHandler);
	}
	public void upload()
	{
		editor.handleExport(false);
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
		String reqMethod = httpExchange.getRequestMethod();
		//System.out.println("handle:" + reqMethod);
		String htmlResponse = "OK";
		
		String requestParamValue=null; 
		if("GET".equals(reqMethod))
		{ 
		   //System.out.println("GET");
		   requestParamValue = handleGetRequest(httpExchange);
		   if (!requestParamValue.equals("ping"))
			System.out.println("GET request params: " + requestParamValue);
		   if (requestParamValue.equals("ping"))
		   {
			   // do nothing, a OK is default to send back
		   }
		   else if (requestParamValue.equals("compile"))
		   {
			   editor.setAlwaysOnTop(false);
			   editor.setAlwaysOnTop(true);
			   editor.setAlwaysOnTop(false);
			   api.verifyCompile();
		   }
		   else if (requestParamValue.equals("upload"))
		   {
			   editor.setAlwaysOnTop(false);
			   editor.setAlwaysOnTop(true);
			   editor.setAlwaysOnTop(false);
			   api.upload();
		   }
		   else if (requestParamValue.startsWith("renameFile"))
		   {
			   String[] params = requestParamValue.split(":");
			   if (params.length != 3) { System.out.println("Missing parameters @ rename file, length " + params.length + "!=3");  return; }
			   api.renameFile(params[1], params[2]);
		   }
		   else if (requestParamValue.startsWith("removeFile"))
		   {
			   String[] params = requestParamValue.split(":");
			   if (params.length != 2) { System.out.println("Missing parameters @ remove file, length " + params.length + "!=2");  return; }
			   api.removeFile(params[1]);
		   }
		   else if (requestParamValue.startsWith("addFile"))
		   {
			   String[] params = requestParamValue.split(":");
			   if (params.length != 2) { System.out.println("Missing parameters @ add file, length " + params.length + "!=2");  return; }
			   api.addNewFile(params[1], "");
			   editor.handleSave(true);
		   }
		   else if(requestParamValue.equals("getJSON"))
		   {
			   htmlResponse = api.getJSON();
		   }
		   else
			   htmlResponse = "unknown GET method: " + requestParamValue;
		}
		else if("POST".equals(reqMethod))
		{ 
		   requestParamValue = handlePostRequest(httpExchange);
		   ParsePOST_JSON(requestParamValue);
		}

		//System.out.println(requestParamValue); // debug
		handleResponse(httpExchange, htmlResponse); 
	}
	public void ParsePOST_JSON(String data)
	{
		JSONObject jsonObj = new JSONObject(data);
		String command = jsonObj.getString("command"); // this should be implemented later
		JSONArray arr = jsonObj.getJSONArray("files");
		
		try{api.RemoveFilesNotInJSON(arr);}
		catch (Exception e) {e.printStackTrace();}
		
		for (int i = 0; i < arr.length(); i++)
		{
			JSONObject e = arr.getJSONObject(i);
			String name = e.getString("name");
			String cpp = e.getString("cpp");
			if (name.equals("GUI_TOOL.json"))
				api.SetJSON(cpp);
			else
				api.addNewFile(name, cpp); // uses reflection to use private members
		}
		//System.out.println(data);
		editor.handleSave(true);
	}
	
	
	private String handleGetRequest(HttpExchange httpExchange) {
		httpExchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
		//System.out.println("handleGetRequest uri:" + httpExchange.getRequestURI());
		return httpExchange.
			getRequestURI()
			.toString()
			.split("\\?")[1]
			.split("=")[1];
	}
	
	private String handlePostRequest(HttpExchange httpExchange) {
		httpExchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
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