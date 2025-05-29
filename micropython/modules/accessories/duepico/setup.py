import setuptools

setuptools.setup(
    name = "duelink-duepico-mp",
    version = "0.0.5",
    author = "GHI Electronics",
    author_email = "support@ghielectronics.com",
    license='MIT', 
    description = "GHI Electronics DUELink DuePico MicroPython Library",
    url = "https://www.duelink.com/",
    install_requires=["duelink-stdlib-mp"],
    packages=setuptools.find_packages(),
    classifiers=[
        "Programming Language :: Python :: Implementation :: MicroPython"
    ]    
)