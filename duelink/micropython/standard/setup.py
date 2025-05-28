import setuptools

setuptools.setup(
    name = "mDUELink",
    version = "0.0.2",
    author = "GHI Electronics",
    author_email = "support@ghielectronics.com",
    license='MIT', 
    description = "GHI Electronics DUE MicroPython library.",
    url = "https://www.duelink.com/",
    packages=setuptools.find_packages(),
    classifiers=[
        "Programming Language :: Python :: Implementation :: MicroPython",        
    ],
    readme = "README.md"
)