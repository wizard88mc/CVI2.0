 /*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package org.java_websocket.eyetracker;

import java.awt.Point;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.util.ArrayList;
import java.util.Date;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.json.simple.JSONObject;

/**
 *
 * @author Matteo Ciman
 */
public class EyeTribeTracker /*extends Thread*/ {
    
    private WebSocketClientTracker websocketClient = null;
    private EyeTribeClient eyeTribeClient = null;
    private String host = null;
    private static final String filenameMachineID = "machineID.ini";
    
    public EyeTribeTracker(String host, int port) {
        //host = "ciman.math.unipd.it";
        this.host = new String().concat("ws://")
                .concat(host).concat(":").concat(String.valueOf(port));
        System.out.println("Creating EyeTracker Client"); 
    }
    
    public void connect() throws Exception {
        
        websocketClient = new WebSocketClientTracker(host, this);
        websocketClient.connect();
        
        eyeTribeClient = new EyeTribeClient(this);
    }
    
    public ArrayList<Point> prepareCalibration(int pointsNumber, long pointDuration, 
            long transitionDuration, int imageWidth) {
        return eyeTribeClient.prepareCalibration(pointsNumber, pointDuration, 
                transitionDuration, imageWidth);
    }
    
    public void startCalibration(long startTime) {
        Executors.newSingleThreadScheduledExecutor()
            .schedule(new Runnable() {

                @Override
                public void run() {
                    eyeTribeClient.startCalibration();
                }

            }, startTime - new Date().getTime(), java.util.concurrent.TimeUnit.MILLISECONDS);
    }
    
    public void setScreenWidthAndHeight(int pixelsWidth, int pixelsHeight) {
        eyeTribeClient.setScreenHeightAndWidth(pixelsWidth, pixelsHeight);
    }
    
    public void sendCalibrationResult(JSONObject packet) {
        websocketClient.sendCalibrationResult(packet);
    }
    
    /**
     * Communicates to the EyeTribeClient to start sending data to the server
     * @param startTime: the time to start at
     */
    public void startSendingData(final long startTime) {
        Executors.newSingleThreadScheduledExecutor()
                .schedule(new Runnable() {

                @Override
                public void run() {
                    eyeTribeClient.startSendDataToServer(startTime);
                }
            }, startTime - new Date().getTime(), TimeUnit.MILLISECONDS);
    }
    
    public void sendGazeData(JSONObject packet) {
        
        websocketClient.sendEyeTrackerData(packet);
    }
    
    /**
     * Retrieves the ID associated with the current PC used
     * @return the machine ID or 0
     */
    public int getMachineID() {
        
        File file = new File(filenameMachineID);
        
        if (!file.exists()){
            return 0;
        }
        else {
            try {
                BufferedReader reader = new BufferedReader(new FileReader(file));
                String machineID = reader.readLine();
                
                reader.close();
                return Integer.valueOf(machineID);
            }
            catch(Exception exc) {
                return 0;
            }
        }
    }
    
    /**
     * Stores the new machine ID in the settings file
     * @param machineID the new ID for the current machine
     */
    public void saveNewMachineID(int machineID) {
        
        File file = new File(filenameMachineID);
        try {
            if (!file.exists()) {
                file.createNewFile();
            }
            BufferedWriter writer = new BufferedWriter(new FileWriter(file, false));
            writer.write(String.valueOf(machineID));
            writer.flush();
            writer.close();
        }
        catch(Exception exc) {
            exc.printStackTrace();
        }
    }
    
    /**
     * Tells the WebsocketClient to send a packet that tells that the eye tracker
     * is connected
     */
    public void eyeTrackerConnected() {
        
        websocketClient.sendTrackerConnected();
    }
    
    /**
     * Tells the WebsocketClient to send a packet that tells that the eye tracker
     * is NOT connected
     */
    public void eyeTrackerNotConnected() {
        
        websocketClient.sendTrackerNotConnected();
    }
    
    /**
     * Used to communicate the result of the calibration to the EyeTracker
     * @param result the result of the calibration (the acceptance or not of 
     * the doctor of the result of the calibration)
     */
    public void communicateTrainingResult(boolean result) {
        
        eyeTribeClient.resultCalibration(result);
    }
    
    /**
     * Informs the EyeTribeClient to stop sending data to the server since the 
     * exercise is stopped by the doctor.
     */
    public void stopSendDataToServer() {
        
        eyeTribeClient.stopSendDataToServer();
    }
    
    public static void main(String args[]) {
        
        try {
        EyeTribeTracker eyeTracker = new EyeTribeTracker("localhost", 8000);
        try {
            Thread.sleep(2000);
        }
        catch(Exception exc) {
            
        }
        eyeTracker.connect();
        }
        catch(Exception exc) {
            exc.printStackTrace();
        }
    }
}
