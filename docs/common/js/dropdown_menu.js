function toggleMenu() {
	var x = document.getElementById("id-sidemenu");
	if (x.style.width === "250px") {
		closeNav()
	} else {
		openNav();
	}
}


function openNav() {
	document.getElementById("id-sidemenu").style.width = "250px";
	
	//document.getElementById("id-connect").style.left = "250px";
	

	document.getElementById("id-topbar").animate(
		[
			{ transform: "translateX(0)" }, 
			{ transform: "translateX(250px)" } 
		],
		{
			duration: 350, // Animation duration in milliseconds
			easing: "ease-in-out", // Easing function
			fill: "forwards" // Keep the final state after animation
		}
	);
	
	document.getElementById("id-connect").animate(
		[
			{ transform: "translateX(0)" }, 
			{ transform: "translateX(250px)" } 
		],
		{
			duration: 350, // Animation duration in milliseconds
			easing: "ease-in-out", // Easing function
			fill: "forwards" // Keep the final state after animation
		}
	);
	
	document.getElementById("id-status").animate(
		[
			{ transform: "translateX(0)" }, 
			{ transform: "translateX(250px)" } 
		],
		{
			duration: 350, // Animation duration in milliseconds
			easing: "ease-in-out", // Easing function
			fill: "forwards" // Keep the final state after animation
		}
	);
	
	document.getElementById("id-error").animate(
		[
			{ transform: "translateX(0)" }, 
			{ transform: "translateX(250px)" } 
		],
		{
			duration: 350, // Animation duration in milliseconds
			easing: "ease-in-out", // Easing function
			fill: "forwards" // Keep the final state after animation
		}
	);
	

}

function closeNav() {
	if (document.getElementById("id-sidemenu").style.width === "250px") {
		document.getElementById("id-sidemenu").style.width = "0";
		
		

		document.getElementById("id-topbar").animate(
			[
				{ transform: "translateX(250px)" }, 
				{ transform: "translateX(0)" } 
			],
			{
				duration: 350, // Animation duration in milliseconds
				easing: "ease-in-out", // Easing function
				fill: "forwards" // Keep the final state after animation
			}
		);
		
		document.getElementById("id-connect").animate(
			[
				{ transform: "translateX(250px)" }, 
				{ transform: "translateX(0)" } 
			],
			{
				duration: 350, // Animation duration in milliseconds
				easing: "ease-in-out", // Easing function
				fill: "forwards" // Keep the final state after animation
			}
		);
		
		document.getElementById("id-status").animate(
			[
				{ transform: "translateX(250px)" }, 
				{ transform: "translateX(0)" } 
			],
			{
				duration: 350, // Animation duration in milliseconds
				easing: "ease-in-out", // Easing function
				fill: "forwards" // Keep the final state after animation
			}
		);
		
		document.getElementById("id-error").animate(
			[
				{ transform: "translateX(250px)" }, 
				{ transform: "translateX(0)" } 
			],
			{
				duration: 350, // Animation duration in milliseconds
				easing: "ease-in-out", // Easing function
				fill: "forwards" // Keep the final state after animation
			}
		);
		
		
	}
  
 
}