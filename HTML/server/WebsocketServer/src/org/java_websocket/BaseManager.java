package org.java_websocket;

import java.net.InetSocketAddress;
import java.net.UnknownHostException;
import org.java_websocket.MessagesManagers.BaseMessagesManager;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.util.DatabaseManager;
import org.json.simple.JSONObject;

/**
 *
 * @author Matteo Ciman
 * 
 * @version 0.1
 * v 0.1 First specification of the class
 */
public abstract class BaseManager extends WebSocketServer {
    
    public static final String ADDITIONAL = "ADDITIONAL";
    public static final String CALCULATING = "CALCULATING";
    public static final String CALIBRATION_RESULT = "CALIBRATION_RESULT";
    public static final String CAL_END = "CAL_END";
    public static final String CAL_POINT = "CAL_POINT";
    public static final String CAL_QUAL = "CAL_QUAL";
    public static final String CATCH_ME = "CATCH_ME";
    public static final String CHANGE_SPEED = "CHANGE_SPEED";
    public static final String CONNECTED = "CONNECTED";
    public static final String DATA_IDENTIFIER = "DATA";
    public static final String EYE_TRACKER_STATUS = "EYE_TRACKER_STATUS";
    public static final String EVERYTHING_READY = "EVERYTHING_READY";
    public static final String GAME = "GAME";
    public static final String GAME_ID = "GAME_ID";
    public static final String GAME_IDENTIFICATION = "GAME_IDENTIFICATION";
    public static final String GAME_SETTINGS = "GAME_SETTINGS";
    public static final String GET_PATIENT_ID = "GET_PATIENT_ID";
    public static final String GO_BACK = "GO_BACK";
    public static final String GO_TO_GAME = "GO_TO_GAME";
    public static final String HELP_ME = "HELP_ME";
    public static final String IDENTIFICATION = "IDENTIFICATION";
    public static final String IDENTIFICATION_COMPLETE = "IDENTIFICATION_COMPLETE";
    public static final String IMAGE_HEIGHT = "IMAGE_HEIGHT";
    public static final String IMAGE_SPECIFICATION = "IMAGE_SPECIFICATION";
    public static final String IMAGE_WIDTH = "IMAGE_WIDTH";
    public static final String MACHINE_ID = "MACHINE_ID";
    public static final String MESSAGE_TYPE = "TYPE";
    public static final String NO_CHILD_CLIENT = "NO_CHILD_CLIENT";
    public static final String NO_EYE_TRACKER = "NO_EYE_TRACKER";
    public static final String NOT_READY = "NOT_READY";
    public static final String OFFSET_CALCULATION_COMPLETE = "OFFSET_CALCULATION_COMPLETE";
    public static final String OFFSET_CALCULATION = "OFFSET_CALCULATION";
    public static final String PATIENT_ID = "PATIENT_ID";
    public static final String POINTS = "POINTS";
    public static final String POINT_DURATION = "POINT_DURATION";
    public static final String POINT_DIAMETER = "POINT_DIAMETER";
    public static final String PRESENTATION_COMPLETE = "PRESENTATION_COMPLETE";
    public static final String READY = "READY";
    public static final String READY_TO_PLAY = "READY_TO_PLAY";
    public static final String RESULT = "RESULT";
    public static final String SCREEN_HEIGHT = "SCREEN_HEIGHT";
    public static final String SCREEN_MEASURES = "SCREEN_MEASURES";
    public static final String SCREEN_WIDTH = "SCREEN_WIDTH";
    public static final String START_GAME = "START_GAME";
    public static final String START_OFFSET_CALCULATION = "START_OFFSET_CALCULATION";
    public static final String START_PRESENTATION = "START_PRESENTATION";
    public static final String START_TIME = "START_TIME";
    public static final String START_TRAINING = "START_TRAINING";
    public static final String START_WORKING = "START_WORKING";
    public static final String STOP_GAME = "STOP_GAME";
    public static final String TRAINING_COMPLETE = "TRAINING_COMPLETE";
    public static final String TRAINING_SESSION = "TRAINING_SESSION";
    public static final String TRAINING_SETTINGS = "TRAINING_SETTINGS";
    public static final String TRAINING_VALIDATION = "TRAINING_VALIDATION";
    public static final String TRANSITION_DURATION = "TRANSITION_DURATION";
    public static final String WITHOUT_TRACKER = "WITHOUT_TRACKER";
    
    protected static String gameIdentification = null;
    protected static String patientID = null;
    protected static boolean eyeTrackerConnected = false;
    protected static boolean childClientConnected = false;
    public static boolean useEyeTracker = true;
    protected static boolean alreadyTrained = false;
    protected static ServerManager serverManager;
    protected static BaseMessagesManager messageManager;
    protected static IPADClientManager patientManager = null;
    protected static EyeTrackerManager eyeTrackerManager = null;
    public static DatabaseManager dbManager = null;
    
    protected String clientType = null;
    protected WebSocket clientConnected = null;
    protected int machineID = 0;
    
    public BaseManager(String clientType, int port) throws UnknownHostException {
        super(new InetSocketAddress(port));
        this.clientType = clientType;
        
        if (dbManager == null) {
            dbManager = new DatabaseManager();
        }
    }
    
    @Override
    public void onOpen(WebSocket conn, ClientHandshake handshake) {
        if (WebSocket.DEBUG) {
            System.out.println("Opening connection in " + clientType + " Manager");
        }
        
        JSONObject message = new JSONObject();
        message.put(BaseManager.MESSAGE_TYPE, BaseManager.IDENTIFICATION);
        conn.send(message.toJSONString());
        
        if (WebSocket.DEBUG) {
            System.out.println("Sending identification request");
        }
    }
    
    public boolean checkClientType(String answer) {
        return answer.equals(clientType);
    }
    
    public static void setServerManager(ServerManager serverManager) {
        BaseManager.serverManager = serverManager;
    }
    
    public void sendPacket(JSONObject packet) {
        
        clientConnected.send(packet.toJSONString());
    }
}
