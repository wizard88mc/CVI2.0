package org.java_websocket.util;

import java.text.DecimalFormat;

/**
 *
 * Some Math utility functions
 * 
 * @author Matteo Ciman
 */
public class MathUtils {
    
    public static Double checkInfiniteOrNaN(Double value) {
        
        if (Double.isInfinite(value) || Double.isNaN(value)) {
            value = 0.0;
        }
        
        return value;
    }
    
    public static DecimalFormat twoDigits = new DecimalFormat("###.#");
    
    static {
        MathUtils.twoDigits.setMaximumFractionDigits(1);
    }
}
