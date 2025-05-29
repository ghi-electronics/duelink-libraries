import setuptools

setuptools.setup(
    name = "duelink-stdlib-mp",
    version = "0.0.4",
    author = "GHI Electronics",
    author_email = "support@ghielectronics.com",
    license='MIT', 
    description = "GHI Electronics DUELink MicroPython Library.",
    url = "https://www.duelink.com/",
    packages=setuptools.find_packages(),
    classifiers=[
        "Programming Language :: Python :: Implementation :: MicroPython"
    ],
    long_description="GHI Electronics DUELink MicroPython Library.",
    long_description_content_type='text/markdown'    
)