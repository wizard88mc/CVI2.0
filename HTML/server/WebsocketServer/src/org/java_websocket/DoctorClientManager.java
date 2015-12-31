package org.java_websocket;

import java.net.UnknownHostException;
import java.util.ArrayList;
import org.json.simple.JSONObject;
import org.json.simple.JSONValue;
import org.java_websocket.Messages.DoctorClientPacket;
import org.java_websocket.MessagesManagers.CatchMeMessagesManager;
import org.java_websocket.MessagesManagers.HelpMeMessagesManager;

/**
 *
 * @author Matteo Ciman
 * 
 * @version 0.1
 * 
 * 0.1 First specification of the class
 */
public class DoctorClientManager extends BaseManager {
    
    protected ArrayList<String> messagesToSend = new ArrayList<String>();
    
    public DoctorClientManager(int port) throws UnknownHostException {
        super("DOCTOR_CLIENT", port);
    }
    
    @Override
    public void onError(WebSocket client, Exception exc) {
        System.out.println("Error in " + clientType + " Manager, " 
                + exc.toString());
        
        exc.printStackTrace();
        
        clientConnected = null;
    }
    
    @Override
    public boolean onMessage(WebSocket sender, String message) {
        
        JSONObject packet = (JSONObject)JSONValue.parse(message);
        
        String packetType = (String) packet.get(BaseManager.MESSAGE_TYPE);
        
        if (packetType.equals(BaseManager.CHANGE_SPEED)) {
            
            serverManager.messageFromDoctorToChildClient(packet);
        }
        else if (packet.get(BaseManager.MESSAGE_TYPE).equals(BaseManager.EYE_TRACKER_STATUS)) {
            
            JSONObject packetAnswer = new JSONObject();
            packetAnswer.put(BaseManager.MESSAGE_TYPE, BaseManager.EYE_TRACKER_STATUS);
            if (BaseManager.eyeTrackerConnected) {
                
                packetAnswer.put(BaseManager.DATA_IDENTIFIER, 
                        BaseManager.CONNECTED);
            }
            else {
                
                packetAnswer.put(BaseManager.DATA_IDENTIFIER, "NOT_CONNECTED");
            }
            clientConnected.send(packetAnswer.toJSONString());
        }
        else if (packetType.equals(BaseManager.EVERYTHING_READY)) {
            if (BaseManager.eyeTrackerConnected && 
                    BaseManager.childClientConnected) {
                
                packet.put(BaseManager.DATA_IDENTIFIER, BaseManager.READY);
            }
            if (!BaseManager.eyeTrackerConnected) {
                
                packet.put(BaseManager.DATA_IDENTIFIER, BaseManager.NOT_READY);
                packet.put(BaseManager.ADDITIONAL, BaseManager.NO_EYE_TRACKER);
            }
            if (!BaseManager.childClientConnected) {
                
                packet.put(BaseManager.DATA_IDENTIFIER, BaseManager.NOT_READY);
                packet.put(BaseManager.ADDITIONAL, BaseManager.NO_CHILD_CLIENT);
            }
            
            clientConnected.send(packet.toJSONString());
        }
        else if (packetType.equals(BaseManager.GAME)) {
            
            if (patientManager != null) {
                
                patientManager.sendPacket(packet);
                packet.put(BaseManager.RESULT, true);
            }
            else {
                
                packet.put(BaseManager.RESULT, false);
            }
            
            clientConnected.send(packet.toJSONString());
        }
        else if (packetType.equals(BaseManager.GAME_SETTINGS)) {
            
            patientManager.sendPacket(packet);
            gameIdentification = (String)packet.get(BaseManager.GAME_IDENTIFICATION);
        }
        else if (packetType.equals(BaseManager.GET_PATIENT_ID)) {
            
            packet.put(BaseManager.DATA_IDENTIFIER, patientID);
            clientConnected.send(packet.toJSONString());
        }
        else if (packetType.equals(BaseManager.GO_TO_GAME)) {
            
            String newPatientID = (String)packet.get(BaseManager.PATIENT_ID);
            
            if (!newPatientID.equals(patientID)) {
                patientID = newPatientID;
                BaseManager.alreadyTrained = false;
                BaseManager.useEyeTracker = true;
            }
            
            JSONObject packetToSend = new JSONObject();
            packetToSend.put(BaseManager.MESSAGE_TYPE, BaseManager.GAME);
            packetToSend.put(BaseManager.DATA_IDENTIFIER, 
                    (String)packet.get(BaseManager.GAME));
            
            serverManager.messageFromDoctorToChildClient(packetToSend);
        }
        else if (packetType.equals(BaseManager.IDENTIFICATION)) {
            
            if (checkClientType((String)packet.get(BaseManager.DATA_IDENTIFIER))) {
                
                System.out.println("Identification complete: " + clientType);
                clientConnected = sender;
                JSONObject packetToSend = new JSONObject();
                packetToSend.put(BaseManager.MESSAGE_TYPE, BaseManager.IDENTIFICATION_COMPLETE);
                clientConnected.send(packetToSend.toJSONString());
            }
            else {
                System.out.println("Wrong identification type for " + clientType
                        + " Manager");
            }
        }
        else if (packetType.equals(BaseManager.SCREEN_MEASURES)) {
            
            if (patientManager != null) {
                
                patientManager.sendPacket(packet);
            }
            else {
                
                packet.put(BaseManager.RESULT, false);
                packet.put("ERROR", "01");
                
                clientConnected.send(packet.toJSONString());
            }
        }
        /*
         * Everything is ready, the doctor has say that it is time to start
         * the game: 
         * 1. Creates a new visit in the DB
         * 2. Defines folder where save packets
         * 3. Call server method to calculate start time
         */
        else if (packetType.equals(BaseManager.START_GAME)) {
            
            //patientID = (String)packet.get("PATIENT_ID");
            //String gameIdentification = (String)packet.get("GAME_ID");
            int gameID = dbManager.getGameID(gameIdentification);
            int visitID = dbManager.insertNewVisit(new Integer(patientID), 
                    new Integer(gameID));
            
            System.out.println("Game identification: " + gameIdentification);
            
            if (gameIdentification.equals(BaseManager.CATCH_ME)) {
                
                messageManager = new CatchMeMessagesManager(patientID, visitID);
                String folder = messageManager.getFolderWhereArchive();
                dbManager.setFolder(visitID, folder);
                patientManager.writeGameSpecs();
            }
            else if (gameIdentification.equals(BaseManager.HELP_ME)) {
                
                messageManager = new HelpMeMessagesManager(patientID, visitID);
                String folder = messageManager.getFolderWhereArchive();
                dbManager.setFolder(visitID, folder);
            }
            
            messageManager.start();
            serverManager.timeToStart();
        }
        else if (packetType.equals(BaseManager.START_PRESENTATION) || 
                packetType.equals(BaseManager.GO_BACK)) {
            
            patientManager.sendPacket(packet);
        }
        else if (packetType.equals(BaseManager.STOP_GAME)) {
            serverManager.stopGame(packet);
        }
        /**
         * This packet contains the settings selected by the doctor for the training
         * This packet has to be sent to the eye tracker that has to calculate 
         * the training points
         */
        else if (packetType.equals(BaseManager.TRAINING_SETTINGS)) {
            
            BaseManager.useEyeTracker = true;
            BaseManager.alreadyTrained = false;
            
            eyeTrackerManager.sendPacket(packet);
            patientManager.sendPacket(packet);
        }
        /**
         * Training completed, the doctor decides if keep the current
         * training session or to repeat it again
         */
        else if (packetType.equals(BaseManager.TRAINING_VALIDATION)) {
            
            eyeTrackerManager.sendPacket(packet);
            Boolean result = (Boolean) packet.get(BaseManager.DATA_IDENTIFIER);
            /**
             * If the doctor accepts the calibration
             */
            if (result) {
                BaseManager.alreadyTrained = true;
                BaseManager.useEyeTracker = true;
            }
        }         
        /*
         * Real-time visit without the eye-tracker or using the previous 
         * calibration if alrady used
         */
        else if (packetType.equals(BaseManager.WITHOUT_TRACKER)) {
            
            if (!BaseManager.alreadyTrained) {
                BaseManager.useEyeTracker = false;
            }
            /**
             * If already trained we use the previous calibration 
             */
            else {
                BaseManager.useEyeTracker = true;
            }
        }
        return true;
    }
    
    @Override
    public void onClose(WebSocket client, int code, String reason, 
            boolean remote) {
        System.out.println("Connection closed for " + clientType + " Manager");
        clientConnected = null;    
    }
    
    /**
     * Sends a message to the doctor
     * @param packet 
     */
    public void sendMessageToDoctorClient(DoctorClientPacket packet) 
    {    
        if (clientConnected != null) {
            clientConnected.send(packet.toJSONString());
        }
        else {
            messagesToSend.add(packet.toJSONString());
        }
    }
    
    @Override
    public void sendPacket(JSONObject packet) 
    {
        if (clientConnected != null) {
            clientConnected.send(packet.toJSONString());
        }
        else {
            messagesToSend.add(packet.toJSONString());
        } 
    }
}
