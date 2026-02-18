import setuptools

from setuptools import setup

# read the contents of your README file
from pathlib import Path
this_directory = Path(__file__).parent
long_description = (this_directory / "README.md").read_text()

setuptools.setup(
    name = "duelink-stdlib-mp",
    version = "0.1.1",
    author = "GHI Electronics",
    author_email = "support@ghielectronics.com",
    license='MIT', 
    description = "GHI Electronics DUELink MicroPython Library.",
    url = "https://www.duelink.com/",
    packages=setuptools.find_packages(),
    classifiers=[
        "Programming Language :: Python :: Implementation :: MicroPython"
    ],
    long_description=long_description,
    long_description_content_type='text/markdown',
    keywords = ["due", "duelink", "ghi"],
    project_urls={  
        "Bug Reports": "https://github.com/ghi-electronics/duelink-libraries/issues",
        "Source": "https://github.com/ghi-electronics/duelink-libraries/tree/main/micropython",
    }
)