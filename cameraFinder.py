import socket

def Ip_finder():
    for i in range(1,255):
        ip = f"192.168.100.{i}"

        # We create TCP connection
        # AF_INET = IPv4, SOCK_STREAM = TCP type(not UDP)
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.1)
        result = sock.connect_ex((ip,554))

        if result == 0:
          print(f"Camera found at IP: {ip}")
          sock.close()
          return ip
        else:
          sock.close()

  
    return None

