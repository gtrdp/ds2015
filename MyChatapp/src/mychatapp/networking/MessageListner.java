/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package mychatapp.networking;

import java.util.logging.Logger;

/**
 *
 * @author vnpandey
 */
public class MessageListner extends Thread{
    ServerSocket server;
      int port = 8877;
      writeablegui gui;
      public MessageListner(writeablegui, int port){
      this.port = port;
      this.gui = gui;
      
      server = new ServerSocket(port);
      } catch (IOException ex){
    Logger.getLogger(MessageListner.class.getname()).
}
}
      public MessageListner(){
    try{
      server = new SeverSocket(port);
      } catch (IOException ex) {
Logger.getLogger(MessageListener.class .getName()).Level.server,ex)
}
}
        @Override
      public void run() {
          Socket clientSocket;
while ((clientSocket = server.accept())!= null){
InputStream in = clientSocket.getInputStream();
BufferedReader br = new BufferReader(newInputstreamReader(is));
Stringline = br.readLine();
gui.Write(line);

}
      }
} catch (IOException ex){
    Logger.getLogger(MessageListner.class.getname()).
}
      
}
}
    
}
