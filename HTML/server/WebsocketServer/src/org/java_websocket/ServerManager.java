package org.java_websocket;

/**
 *
 * @author Matteo Ciman
 * 
 * @version 1.0
 */

import java.net.BindException;
import java.net.UnknownHostException;
import java.util.Date;
import javax.swing.JOptionPane;
import org.java_websocket.eyetracker.EyeTribeTracker;
import org.json.simple.JSONObject;

public class ServerManager {
    
    private static String HOST = "localhost";
    
    private static final long MINIMUM_INCREMENT = 5000;
    
    private static final int EYE_TRACKER_PORT = 8000;
    private static final int CHILD_CLIENT_PORT = 8001;
    private static final int DOCTOR_CLIENT_PORT = 8002;
    
    private EyeTrackerManager clientEyeTracker = null;
    private IPADClientManager clientChild = null;
    private DoctorClientManager clientDoctor = null;
    
    private static boolean gameInAction = false;
    
    protected void timeToStart() {
        
        gameInAction = true;
        
        long timeToStart = new Date().getTime() + MINIMUM_INCREMENT;
        clientEyeTracker.comunicateStartTime(timeToStart);
        clientChild.comunicateStartTime(timeToStart);
    }
    
    public void startManagers() {
        
        clientEyeTracker.start();
        clientChild.start();
        clientDoctor.start();
    }
    
    /**
     * Stops the current game
     * @param packet 
     */
    public void stopGame(JSONObject packet) {
        
        if (gameInAction) {
            gameInAction = false;
            clientEyeTracker.sendPacket(packet);
            clientChild.sendPacket(packet);
            clientDoctor.sendPacket(packet);
            WebSocketWithOffsetCalc.messageManager.gameIsEnded();
        }
    }
    
    public void messageFromDoctorToChildClient(JSONObject packet) {
        
        clientChild.sendPacket(packet);
    }
    
    public ServerManager() throws UnknownHostException {
        
        clientDoctor = new DoctorClientManager(DOCTOR_CLIENT_PORT);
        clientEyeTracker = new EyeTrackerManager(EYE_TRACKER_PORT);
        clientChild = new IPADClientManager(CHILD_CLIENT_PORT);
        
        WebSocketWithOffsetCalc.setDoctorClientManager(clientDoctor);
    }
    
    public void stopEverything() {
        try {
            
            gameInAction = false;
            
            clientDoctor.stop();
            clientEyeTracker.stop();
            clientChild.stop();
        }
        catch(Exception exc) {
            exc.printStackTrace();
        }
    }
    
    /* Definire un metodo che permetta di chiudere applicazione
     * che deve però essere invocato da un utente esterno
     */
    public static void main(String args[]) {
        WebSocket.DEBUG = false;
        
        //host = "ciman.math.unipd.it";
        
        if (args.length != 0) {
            HOST = args[0];
        }
        if (WebSocket.DEBUG) {
            System.out.println(HOST);
        }
        
        ServerManager manager = null;
        
        try {
            
            manager = new ServerManager();
            BaseManager.setServerManager(manager);
            
            manager.startManagers();
            
            System.out.println("**** SERVER STARTED ****");
            
            Thread.sleep(3000);
            EyeTribeTracker eyeTracker = new EyeTribeTracker(HOST, 
                    EYE_TRACKER_PORT);
            eyeTracker.connect();
            
            //EyeTrackerSimulator simulator = new EyeTrackerSimulator(host, 8000);
            //simulator.connect();
        }
        catch(BindException exc) {
            JOptionPane.showMessageDialog(null, "Un'altra istanza del programma" + 
                    "è già avviata.\n Chiuderla e riavviare.", "Errore", 
                    JOptionPane.ERROR_MESSAGE);
        }
        catch (Exception exc) {
            if (exc.getMessage().equals("EXCEPTION_NO_EYE_TRIBE_SERVER_RUNNING")) {
                
                JOptionPane.showMessageDialog(null, "Eye Tribe non partito. " + 
                        "E' stato attivato il programma necessario?", 
                        "Tracker non avviato", JOptionPane.ERROR_MESSAGE);
            }
            //exc.printStackTrace();
            if (manager != null) {
                
                manager.stopEverything();
                System.exit(0);
            }
        }
    }
}
