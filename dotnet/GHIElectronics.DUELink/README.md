# GHIElectronics.DUELink

The official .NET library for communicating with **DUELink** devices from **GHI Electronics**.

This library provides an easy and reliable way to send commands and interact with DUELink-enabled modules over serial connections.

------------------------------------------------------------------------

## 📦 Installation

Install via .NET CLI:

    dotnet add package GHIElectronics.DUELink

Or via Package Manager:

    Install-Package GHIElectronics.DUELink

------------------------------------------------------------------------

## 🚀 Getting Started

### Basic Example

``` csharp
using GHIElectronics.DUELink;

// Create DUELink controller
var availablePort = DUELinkController.GetConnectionPort();
var duelink = new DUELinkController(availablePort);


// Read Analog on pin1
var analog = duelink.Analog.Read(1)
Console.WriteLine($"Analog value: {analog}");
```

------------------------------------------------------------------------

## 🔌 Features

-   USB-Serial communication support
-   Command execution interface
-   Firmware interaction
-   Device discovery
-   Module chaining (DaisyLink) support


------------------------------------------------------------------------

## 🛠 Requirements

-   .NET 6.0 or later
-   A DUELink-enabled device
-   USB or Serial connection

------------------------------------------------------------------------

## 📖 Documentation

Full documentation, tutorials, and firmware downloads:

https://www.duelink.com

------------------------------------------------------------------------

## 🏢 About GHI Electronics

-   Website: https://www.ghielectronics.com
-   DUELink Platform: https://www.duelink.com

------------------------------------------------------------------------

## 📄 License

This project is licensed under the MIT License.
