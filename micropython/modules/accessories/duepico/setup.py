import setuptools

from setuptools import setup

# read the contents of your README file
from pathlib import Path
this_directory = Path(__file__).parent
long_description = (this_directory / "README.md").read_text()

setuptools.setup(
    name = "duelink-duepico-mp",
    version = "0.0.7",
    author = "GHI Electronics",
    author_email = "support@ghielectronics.com",
    license='MIT', 
    description = "GHI Electronics DUELink DuePico MicroPython Library.",
    url = "https://www.duelink.com/",
    install_requires=["duelink-stdlib-mp"],
    packages=setuptools.find_packages(),
    classifiers=[
        "Programming Language :: Python :: Implementation :: MicroPython"
    ],
    long_description=long_description,
    long_description_content_type='text/markdown'     
)