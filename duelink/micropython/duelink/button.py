
class ButtonController:    

    def __init__(self, transport):
        self.transport = transport

    def btnEnable(self, pin, state):
        if state :
            self.transport.execute(f"btnenable({pin},1)")
        else:
            self.transport.execute(f"btnenable({pin},0)")
            
    def btnUp(self, pin):
        r, s = self.transport.execute(f"btnup({pin})")
        if s:
            return r[0] == '1'
        return 0
    
    def btnDown(self, pin):
        r, s = self.transport.execute(f"btndown({pin})")
        if s:
            return r[0] == '1'
        return 0
