import setuptools

setuptools.setup(
    name = "mDLDuePico",
    version = "0.0.4",
    author = "GHI Electronics",
    author_email = "support@ghielectronics.com",
    license='MIT', 
    description = "GHI Electronics DuePico MicroPython library.",
    url = "https://www.duelink.com/",
    install_requires=["mDUELink"],
    packages=setuptools.find_packages(),
    classifiers=[
        "Programming Language :: Python :: Implementation :: MicroPython"
    ]    
)