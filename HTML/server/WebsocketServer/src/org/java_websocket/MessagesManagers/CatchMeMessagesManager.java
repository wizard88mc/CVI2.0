package org.java_websocket.MessagesManagers;

import java.io.IOException;
import org.java_websocket.BaseManager;
import org.java_websocket.Messages.CatchMeDataPacket;
import org.java_websocket.Messages.CatchMeDoctorMessage;
import org.java_websocket.Messages.EyeTrackerDataPacket;
import org.json.simple.JSONObject;

/**
 *
 * @author Matteo
 */
public class CatchMeMessagesManager extends BaseMessagesManager {
    
    public CatchMeMessagesManager(String patientID, int visitID) {
        super(patientID, visitID);
    }
    
    @Override
    public void run() {
        
        while (!endGame) {
            
            /**
             * If using the EyeTracker
             */
            if (BaseManager.useEyeTracker) {
                synchronized(bufferSynchronizer) {
                    while (messagesGameBuffer.isEmpty() && 
                            messagesEyeTrackerBuffer.isEmpty()) {
                        try {
                            bufferSynchronizer.wait();
                        }
                        catch(InterruptedException exc) {}
                    }
                }

                CatchMeDataPacket messageGame = null;
                EyeTrackerDataPacket messageEyeTracker = null;

                boolean removeMessageGame = false;
                boolean removeMessageEyeTracker = false;

                /**
                 * Both buffers have packets, if the Delta of the timestamps
                 * is inside the maximum possible range we put them together, 
                 * otherwise I send the one with the lowest timestamp
                 */
                if (!messagesEyeTrackerBuffer.isEmpty() && !messagesGameBuffer.isEmpty()) {

                    messageGame = new CatchMeDataPacket(messagesGameBuffer.get(0));
                    messageEyeTracker = new EyeTrackerDataPacket(messagesEyeTrackerBuffer.get(0));

                    Long timeMessageGame = messageGame.getTime();
                    Long timeEyeTrackerMessage = messageEyeTracker.getTime();

                    Long deltaTime = Math.abs(timeMessageGame - timeEyeTrackerMessage);

                    /**
                     * Building the packet with information from the game and 
                     * the EyeTracker, timestamp is the average of both
                     */
                    if (deltaTime <= MAX_DIFFERENCE) {

                        removeMessageGame = true;
                        removeMessageEyeTracker = true;

                        long time = (messageEyeTracker.getTime() + messageGame.getTime())
                                / 2;

                        messageEyeTracker.setTime(time);
                        messageGame.setTime(time);

                        writeEyeTrackerMessage(messageEyeTracker);
                        writeGameMessage(messageGame);
                    }
                    /**
                     * The packet will contain only information from the game,
                     * no information from the EyeTracker
                     */
                    else if (timeMessageGame < timeEyeTrackerMessage) {

                        removeMessageGame = true;
                        writeGameMessage(messageGame);

                        JSONObject stupidEye = new JSONObject();
                        stupidEye.put("TIME", messageGame.getTime());
                        stupidEye.put("DATA", "-1 -1");

                        messageEyeTracker = new EyeTrackerDataPacket(stupidEye);
                        writeEyeTrackerMessage(messageEyeTracker);
                        
                        clearEyeTrackerData = true;
                    }
                    /**
                     * Only information from the EyeTracker or information 
                     * of the game of a future timestamp
                     */
                    else if (timeEyeTrackerMessage < timeMessageGame) {

                        removeMessageEyeTracker = true;
                    }
                }
                else if (messagesGameBuffer.isEmpty()) {
                    
                    messageEyeTracker = 
                            new EyeTrackerDataPacket(messagesEyeTrackerBuffer.get(0));

                    if (System.currentTimeMillis() - 
                            (startTime + messageEyeTracker.getTime()) > MAX_TIME_WAITING) {

                        removeMessageEyeTracker = true;
                    }
                }
                else if (messagesEyeTrackerBuffer.isEmpty()) {
                    messageGame = new CatchMeDataPacket(messagesGameBuffer.get(0));

                    if (System.currentTimeMillis() - 
                            (startTime + messageGame.getTime()) > MAX_TIME_WAITING) {
                        
                        removeMessageGame = true;
                        writeGameMessage(messageGame);

                        JSONObject stupidEye = new JSONObject();
                        stupidEye.put("TIME", messageGame.getTime());
                        stupidEye.put("DATA", "-1 -1");

                        messageEyeTracker = new EyeTrackerDataPacket(stupidEye);
                        writeEyeTrackerMessage(messageEyeTracker);
                    }
                }
                if (removeMessageEyeTracker || removeMessageGame) {

                    synchronized(bufferSynchronizer) {
                        if (removeMessageEyeTracker) {
                            synchronized(bufferSynchronizer) {
                                messagesEyeTrackerBuffer.remove(0);
                            }
                        }
                        if (removeMessageGame) {
                            synchronized(bufferSynchronizer) {
                                messagesGameBuffer.remove(0);
                            }
                        }
                        
                        if (clearEyeTrackerData) {
                            synchronized(bufferSynchronizer) {
                                messagesEyeTrackerBuffer.clear();
                                clearEyeTrackerData = false;
                            }
                        }
                    }
                    /**
                        * Devo spedire pacchetto al client con le info
                        */

                    if (messageGame != null) {
                        CatchMeDoctorMessage message = 
                                new CatchMeDoctorMessage(messageGame, 
                                        messageEyeTracker);
                        writeDeltaMessage(message.toString());
                        doctorManager.sendMessageToDoctorClient(message);
                    }
                }
            }
            /**
             * If not using the EyeTracker
             */
            else {
                synchronized(bufferSynchronizer) {
                    while (messagesGameBuffer.isEmpty()) {
                        try {
                            bufferSynchronizer.wait();
                        }
                        catch(InterruptedException exc) {}
                    }
                }
                
                if (!messagesGameBuffer.isEmpty()) {
                    CatchMeDataPacket packet = 
                            new CatchMeDataPacket(messagesGameBuffer.get(0));
                    
                    writeGameMessage(packet);
                    JSONObject stupidEye = new JSONObject();
                    stupidEye.put("TIME", packet.getTime());
                    stupidEye.put("DATA", "-1 -1");

                    EyeTrackerDataPacket messageEyeTracker = 
                            new EyeTrackerDataPacket(stupidEye);
                    writeEyeTrackerMessage(messageEyeTracker);
                    
                    synchronized(bufferSynchronizer) {
                        messagesGameBuffer.remove(0);
                    }
                    
                    CatchMeDoctorMessage message = 
                            new CatchMeDoctorMessage(packet, messageEyeTracker);
                    writeDeltaMessage(message.toString());
                    doctorManager.sendMessageToDoctorClient(message);
                }
            }
        }
        
        System.out.println("MessageManager has ended");
    }
    
    /**
     * Writes data about the touch position and the image position on the screen
     * @param packet a CatchMeDataPacket with data of touch and image
     */
    void writeGameMessage(CatchMeDataPacket packet) {

        try {
            touchWriter.write(packet.getTouchString());
            touchWriter.newLine();
            touchWriter.flush();
            imageWriter.write(packet.getImageString());
            imageWriter.newLine();
            imageWriter.flush();
        }
        catch(IOException exc) {

        }
    }

    /**
     * Writes a string on the file with the delta values
     * @param message the text to write
     */
    void writeDeltaMessage(String message) {
        try {
            deltaWriter.write(message);
            deltaWriter.newLine();
            deltaWriter.flush();
        }
        catch(IOException exc) {}
    }
    
    @Override
    public void gameIsEnded() {
        
        endGame = true;
        
        try {
            touchWriter.close();
            deltaWriter.close();
            imageWriter.close();
            eyeTrackerWriter.close();
        }
        catch(IOException exc) {
            System.out.println("Error in closing file in gameIsEnded");
            System.out.println(exc.toString());
        }
        CatchMePerformanceAnalyzer.dbManager = BaseManager.dbManager;
        new CatchMePerformanceAnalyzer(fileImage, fileEyeTracking, fileTouch, 
                fileSpecs, visitID).start();
    }
}
