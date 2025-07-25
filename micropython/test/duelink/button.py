
class ButtonController:    

    def __init__(self, transport):
        self.transport = transport

    def Enable(self, pin, state, pull):
        if state :
            self.transport.execute(f"btnen({pin},1,{pull})")
        else:
            self.transport.execute(f"btnen({pin},0,{pull})")
            
    def Up(self, pin):
        r, s = self.transport.execute(f"btnup({pin})")
        if s:
            return r[0] == '1'
        return 0
    
    def Down(self, pin):
        r, s = self.transport.execute(f"btndown({pin})")
        if s:
            return r[0] == '1'
        return 0
