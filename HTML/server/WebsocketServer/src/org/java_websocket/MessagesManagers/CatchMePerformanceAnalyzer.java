/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.java_websocket.MessagesManagers;

import java.io.*;
import java.text.DecimalFormat;
import java.util.ArrayList;
import org.java_websocket.util.DatabaseManager;
import org.java_websocket.util.MathUtils;

/**
 *
 * @author Matteo
 */
public class CatchMePerformanceAnalyzer extends Thread {
    
    protected String fileImage = null;
    protected String fileEyeTracker = null;
    protected String fileTouch = null;
    protected String fileGameSpecs = null;
    protected ArrayList<SimplePacket> packetsImage = new ArrayList<SimplePacket>();
    protected ArrayList<SimplePacket> packetsTouch = new ArrayList<SimplePacket>();
    protected ArrayList<SimplePacket> packetsEyeTracker = new ArrayList<SimplePacket>();
    protected int imageWidth;
    protected int imageHeight;
    protected double pointCenter = 1, pointInside = 0.5, pointNear = 0.25 ;
    protected int visitID = 0;
    public static DatabaseManager dbManager = null;
    
    private class SimplePacket {
        protected long time;
        protected long posTop;
        protected long posLeft;
        
        public SimplePacket(long time, long posTop, long posLeft) {
            this.time = time; this.posTop = posTop; this.posLeft = posLeft;
        }
        
        /**
         * Checks if the packet is a valid one or a fake one (-1, -1)
         * @return true if is a valid packet, with values != -1, -1
         */
        public boolean isValidPacket() {
            return posTop != -1L && posLeft != -1L;
        }
    }
    
    public CatchMePerformanceAnalyzer(String fileImage, String fileEyeTracker,
            String fileTouch, String fileGameSpecs, int visitID) {
        this.fileImage = fileImage; this.fileEyeTracker = fileEyeTracker;
        this.fileTouch = fileTouch; this.fileGameSpecs = fileGameSpecs;
        this.visitID = visitID;
    }
    
    @Override
    public void run() {
        
        try {
            BufferedReader readerFileImage = new BufferedReader(new FileReader(fileImage));
            BufferedReader readerFileTouch = new BufferedReader(new FileReader(fileTouch));
            BufferedReader readerFileEyeTracker = new BufferedReader(new FileReader(fileEyeTracker));
            BufferedReader readerFileSpecs = new BufferedReader(new FileReader(fileGameSpecs));
            
            String line = null;
            readerFileSpecs.readLine();
            line = readerFileSpecs.readLine();
            System.out.println(line);
            String[] dimensions = line.split("x");
            System.out.println(dimensions[0]);
            imageWidth = Integer.parseInt(dimensions[0]);
            imageHeight = Integer.parseInt(dimensions[1]);
            
            line = null;
            
            while ((line = readerFileImage.readLine()) != null) {
                
                String secondLine = readerFileTouch.readLine();
                line = line.replace("(", "").replace(")", "");
                secondLine = secondLine.replace("(", "").replace(")", "");
                
                String[] infoImage = line.split(",");
                String[] infoTouch = secondLine.split(",");
                
                packetsImage.add(new SimplePacket(
                        Long.parseLong(infoImage[0]), 
                        Long.parseLong(infoImage[1]),
                        Long.parseLong(infoImage[2])));
                
                packetsTouch.add(new SimplePacket(
                        Long.parseLong(infoTouch[0]),
                        Long.parseLong(infoTouch[1]),
                        Long.parseLong(infoTouch[2])));
            }
            
            while ((line = readerFileEyeTracker.readLine()) != null) {
                
                line = line.replace("(", "").replace(")", "");
                String[] infoEye = line.split(",");
                
                packetsEyeTracker.add(new SimplePacket(
                        Long.parseLong(infoEye[0]), 
                        Long.parseLong(infoEye[1]), 
                        Long.parseLong(infoEye[2])));
            }
            
            // Ho tutti i pacchetti pronti, devo lavorare a coppie
            int totalPackets = Math.min(packetsEyeTracker.size(), packetsImage.size());
            System.out.println("Pacchetti eye: " + packetsEyeTracker.size());
            System.out.println("Pacchetti image: " + packetsImage.size());
            double scoreTouch = 0, scoreEye = 0;
            double percentageInsideTouch = 0, percentageOutsideTouch = 0, 
                    percentageInsideEyes = 0, percentageOutsideEyes = 0;
            int totalPacketsTouch = 0, totalPacketsEye = 0;
            
            for (int i = 0; i < totalPackets; i++) {
                
                SimplePacket packetImage = packetsImage.get(0);
                SimplePacket packetTouch = packetsTouch.get(0);
                SimplePacket packetEye = packetsEyeTracker.get(0);
                
                long startTop = packetImage.posTop + imageHeight / 4;
                long startLeft = packetImage.posLeft + imageWidth / 4;

                /**
                 * Checking if eyes or touch is inside the first half of the 
                 * image with respect to the center
                 */
                boolean isTouchCenter = false, isEyeCenter = false;
                if (packetTouch.isValidPacket()) {
                    isTouchCenter = checkIfInside(startTop, startLeft, imageWidth / 2, 
                        imageHeight / 2, packetTouch.posTop, packetTouch.posLeft);
                    
                    if (isTouchCenter) {
                        scoreTouch += pointCenter;
                        percentageInsideTouch++;
                    }
                }
                
                if (packetEye.isValidPacket()) {
                    
                    isEyeCenter = checkIfInside(startTop, startLeft, 
                        imageWidth / 2, imageHeight / 2, 
                        packetEye.posTop, packetEye.posLeft);
                
                    if (isEyeCenter) {
                        scoreEye += pointCenter;
                        percentageInsideEyes++;
                    }
                }

                if (!isTouchCenter || !isEyeCenter) {

                    if (!isTouchCenter && packetTouch.isValidPacket()) {
                        /**
                         * Checking if the touch is inside the image but not 
                         * in the center
                         */
                        boolean isTouchInside = checkIfInside(packetImage.posTop, 
                                packetImage.posLeft, imageWidth, imageHeight, 
                                packetTouch.posTop, packetTouch.posLeft);

                        if (isTouchInside) {
                            scoreTouch += pointInside;
                            percentageInsideTouch++;
                        }
                        else {
                            percentageOutsideTouch++;
                            if (checkIfInside(packetImage.posTop - imageHeight / 4, 
                                    packetImage.posLeft - imageWidth / 4, 
                                    imageWidth + imageWidth / 2, 
                                    imageHeight + imageHeight / 2, 
                                    packetTouch.posTop, packetTouch.posLeft)) {
                                scoreTouch += pointNear;
                            }
                        }
                    }

                    if (!isEyeCenter && packetEye.isValidPacket()) {
                        /**
                         * Checking if eyes are inside the image but not 
                         * in the center
                         */
                        boolean isEyeInside = checkIfInside(packetImage.posTop, 
                                packetImage.posLeft, imageWidth, imageHeight, 
                                packetEye.posTop, packetEye.posLeft);

                        if (isEyeInside) {
                            scoreEye += pointInside;
                            percentageInsideEyes++;
                        }
                        else {
                            percentageOutsideEyes++;
                            if (checkIfInside(packetImage.posTop - imageHeight / 4, 
                                    packetImage.posLeft - imageWidth / 4, 
                                    imageWidth + imageWidth / 2, 
                                    imageHeight + imageHeight / 2, 
                                    packetEye.posTop, packetEye.posLeft)) {
                                scoreEye += pointNear;
                            }
                        }
                    }
                }

                if (packetEye.isValidPacket()) {
                    totalPacketsEye++;
                }
                if (packetTouch.isValidPacket()) {
                    totalPacketsTouch++;
                }
                packetsEyeTracker.remove(0); packetsImage.remove(0);
                packetsTouch.remove(0);
            }
            
            DecimalFormat twoDigits = new DecimalFormat();
            twoDigits.setMaximumFractionDigits(2);

            scoreTouch = (scoreTouch / totalPacketsTouch) * 100;
            scoreEye = (scoreEye / totalPacketsEye) * 100;
            
            if (Double.isInfinite(scoreTouch) || Double.isNaN(scoreTouch)) {
                scoreTouch = 0.0;
            }
            if (Double.isInfinite(scoreEye) || Double.isNaN(scoreEye)) {
                scoreEye = 0.0;
            }
            
            percentageInsideEyes = MathUtils.checkInfiniteOrNaN(
                    percentageInsideEyes / totalPacketsEye) * 100;
            percentageOutsideEyes = MathUtils.checkInfiniteOrNaN(
                    percentageOutsideEyes / totalPacketsEye) * 100;
            percentageInsideTouch = MathUtils.checkInfiniteOrNaN(
                    percentageInsideTouch / totalPacketsTouch) * 100;
            percentageOutsideTouch = MathUtils.checkInfiniteOrNaN(
                    percentageOutsideTouch / totalPacketsTouch) * 100;

            scoreTouch = Double.parseDouble(twoDigits.format(scoreTouch).replace(",", "."));
            scoreEye = Double.parseDouble(twoDigits.format(scoreEye).replace(",", "."));
            System.out.println("Score touch: " + scoreTouch);
            System.out.println("Score eye: " + scoreEye);
            
            System.out.println("Percentage inside/outside eyes: " + 
                    twoDigits.format(percentageInsideEyes) + "/" + 
                    twoDigits.format(percentageOutsideEyes));
            
            System.out.println("Percentage inside/outside touch: " + 
                    twoDigits.format(percentageInsideTouch) + "/" + 
                    twoDigits.format(percentageOutsideTouch));

            dbManager.insertResultsCatchMeGame(visitID, scoreTouch, scoreEye);
        }
        catch(FileNotFoundException exc) {
            System.out.println("Some files non found in CatchMePerformanceAnalyzer");
            System.out.println(exc.toString());
        }
        catch(IOException exc) {
            System.out.println("IOException in CatchMePerformanceAnalyzer");
            System.out.println(exc.toString());
        }
        catch(Exception exc) {
            System.out.println(exc.toString());
            exc.printStackTrace();
        }
        
    }
    
    /**
     * Checks if a point is inside a square 
     * @param pointTop y position of the top left corner of the square
     * @param pointLeft x position of the top left corner of the square
     * @param width width of the square
     * @param height height of the square
     * @param pointCheckTop y position of the point to check 
     * @param pointCheckLeft x position of the point to check
     * @return true if the point is inside the square, false otherwise
     */
    boolean checkIfInside(long pointTop, long pointLeft, long width, long height,
            long pointCheckTop, long pointCheckLeft) {
        
        return (pointCheckTop > pointTop && pointCheckTop < pointTop + height &&
                pointCheckLeft > pointLeft && pointCheckLeft < pointLeft + width);
    }
    
    /**
     * 
     * @param args the folders where to take data: 
     * [0]: patientID, [1]: visit folder
     */
    public static void main(String args[]) {
        
        String directory = System.getProperty("user.dir");
        System.out.println(directory);
        String separator = File.separator;
        
        String patientID = args[0];
        String visitFolder = args[1];
        int visitID = new Integer(args[2]);
        
        String fileImage = directory//.concat(separator).concat("WebsocketServer")
                .concat(separator).concat("archivio_visite").concat(separator)
                /*.concat("1").concat(separator).concat("2012-8-28-11-2-99")
                .concat(separator).concat("InputImage.txt");*/
                .concat(patientID).concat(separator).concat(visitFolder)
                .concat(separator).concat("InputImage.txt");
        
        String fileEye = directory//.concat(separator).concat("WebsocketServer")
                .concat(separator).concat("archivio_visite").concat(separator)
                /*.concat("1").concat(separator).concat("2012-8-28-11-2-99")*/
                .concat(patientID).concat(separator).concat(visitFolder)
                .concat(separator).concat("InputEyeTracking.txt");
        
        String fileTouch = directory//.concat(separator).concat("WebsocketServer")
                .concat(separator).concat("archivio_visite").concat(separator)
                /*.concat("1").concat(separator).concat("2012-8-28-11-2-99")*/
                .concat(patientID).concat(separator).concat(visitFolder)
                .concat(separator).concat("InputTouch.txt");
        
        String fileSpecs = directory//.concat(separator).concat("WebsocketServer")
                .concat(separator).concat("archivio_visite").concat(separator)
                /*.concat("1").concat(separator).concat("2012-8-28-11-2-99")**/
                .concat(patientID).concat(separator).concat(visitFolder)
                .concat(separator).concat("GameSpecs.ini");
        
        CatchMePerformanceAnalyzer.dbManager = new DatabaseManager();
        
        new CatchMePerformanceAnalyzer(fileImage, fileEye, fileTouch, fileSpecs, 
                visitID).start();
    }
}
