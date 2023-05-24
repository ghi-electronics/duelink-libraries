using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GHIElectronics.DUELink {
    public class Image {
        public uint[] Data { get; }
        public uint Width { get; }
        public uint Height { get;  }
        public Image(uint width, uint height, uint[] data) {
            if (width == 0 || height == 0 || data == null || data.Length  < (width * height)) {
                throw new ArgumentException("Invalid argument.");
            }
            this.Width = width;
            this.Height = height;
            this.Data = new uint[width * height + 2];

            this.Data[0] = this.Width;
            this.Data[1] = this.Height;

            Array.Copy(data, 0, this.Data, 2, this.Width * this.Height);
        }


    }
}
