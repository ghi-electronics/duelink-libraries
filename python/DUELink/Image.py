class ImageController:
    def __init__(self, width: int, height: int, data):
        self.Width = width
        self.Height = height
        self.Data = [0] * ((width * height) + 2)

        self.Data[0] = self.Width
        self.Data[1] = self.Height

        for i in range (width * height):
            self.Data[2 + i] = data[i]

