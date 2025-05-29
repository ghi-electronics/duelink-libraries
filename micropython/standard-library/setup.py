import setuptools

setuptools.setup(
    name = "duelink-stdlib-mp",
    version = "0.0.4",
    author = "GHI Electronics",
    author_email = "support@ghielectronics.com",
    license='MIT', 
    description = "GHI Electronics DUELink MicroPython library.",
    url = "https://www.duelink.com/",
    packages=setuptools.find_packages(),
    classifiers=[
        "Programming Language :: Python :: Implementation :: MicroPython"
    ]    
)